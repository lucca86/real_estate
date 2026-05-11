"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { getSystemSetting, updateSystemSetting } from "@/lib/actions/system-settings"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackupRecord {
  id: string
  type: "manual" | "scheduled"
  backup_scope: "db" | "images" | "both"
  status: "running" | "completed" | "failed"
  blob_url_db?: string | null
  blob_url_images?: string | null
  file_name_db?: string | null
  file_name_images?: string | null
  file_size_db?: number | null
  file_size_images?: number | null
  tables_count?: number | null
  images_count?: number | null
  error_message?: string | null
  created_by_id?: string | null
  created_at: string
  completed_at?: string | null
}

export interface BackupSettings {
  retention: number           // max number of backups to keep
  cronHour: number            // hour of day for daily cron (0-23)
  cronEnabled: boolean        // whether cron is active
  defaultScope: "db" | "images" | "both"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden realizar esta acción")
  }
  return user
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export { formatBytes }

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Triggers a backup by calling the internal API route.
 * This runs server-side so the BLOB token is never exposed to the client.
 */
export async function triggerBackup(
  scope: "db" | "images" | "both",
): Promise<{ success: boolean; backupId?: string; error?: string }> {
  await requireAdmin()

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"

    const res = await fetch(`${baseUrl}/api/backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.error ?? "Error desconocido" }
    }

    revalidatePath("/settings/tools")
    return { success: true, backupId: data.backupId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al iniciar el backup",
    }
  }
}

/**
 * Returns the backup history, most recent first.
 */
export async function getBackupHistory(limit = 50): Promise<BackupRecord[]> {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from("backup_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as BackupRecord[]
}

/**
 * Deletes a specific backup record (does NOT delete the blob file).
 */
export async function deleteBackupRecord(id: string): Promise<void> {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from("backup_history").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/settings/tools")
}

/**
 * Enforces the retention policy: deletes oldest records beyond the limit.
 */
export async function enforceRetention(maxBackups: number): Promise<void> {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from("backup_history")
    .select("id")
    .eq("status", "completed")
    .order("created_at", { ascending: false })

  if (!data || data.length <= maxBackups) return

  const toDelete = data.slice(maxBackups).map((r) => r.id)
  await adminClient.from("backup_history").delete().in("id", toDelete)
  revalidatePath("/settings/tools")
}

// ─── Backup Settings ──────────────────────────────────────────────────────────

export async function getBackupSettings(): Promise<BackupSettings> {
  const [retention, cronHour, cronEnabled, defaultScope] = await Promise.all([
    getSystemSetting("backup_retention"),
    getSystemSetting("backup_cron_hour"),
    getSystemSetting("backup_cron_enabled"),
    getSystemSetting("backup_default_scope"),
  ])

  return {
    retention: retention ? parseInt(retention, 10) : 30,
    cronHour: cronHour ? parseInt(cronHour, 10) : 2,
    cronEnabled: cronEnabled === "true",
    defaultScope: (defaultScope as BackupSettings["defaultScope"]) ?? "both",
  }
}

export async function saveBackupSettings(settings: BackupSettings): Promise<void> {
  await requireAdmin()

  await Promise.all([
    updateSystemSetting("backup_retention", String(settings.retention)),
    updateSystemSetting("backup_cron_hour", String(settings.cronHour)),
    updateSystemSetting("backup_cron_enabled", String(settings.cronEnabled)),
    updateSystemSetting("backup_default_scope", settings.defaultScope),
  ])

  revalidatePath("/settings/tools")
}
