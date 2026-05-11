"use server"

import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import JSZip from "jszip"
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
  retention: number
  cronHour: number
  cronEnabled: boolean
  defaultScope: "db" | "images" | "both"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DB_TABLES = [
  "users",
  "properties",
  "owners",
  "clients",
  "appointments",
  "property_owners",
  "system_settings",
  "backup_history",
]

const IMAGE_CONCURRENCY = 5

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden realizar esta acción")
  }
  return user
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function downloadBatch(
  urls: string[],
  concurrency: number,
): Promise<Array<{ url: string; buffer: Buffer | null; filename: string }>> {
  const results: Array<{ url: string; buffer: Buffer | null; filename: string }> = []
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
          if (!res.ok) return { url, buffer: null, filename: "" }
          const ab = await res.arrayBuffer()
          const parts = url.split("/")
          const filename = parts[parts.length - 1].split("?")[0]
          return { url, buffer: Buffer.from(ab), filename }
        } catch {
          return { url, buffer: null, filename: "" }
        }
      }),
    )
    results.push(...batchResults)
  }
  return results
}

// ─── Core backup logic (runs server-side, no internal fetch) ──────────────────

export async function triggerBackup(
  scope: "db" | "images" | "both",
): Promise<{ success: boolean; backupId?: string; error?: string }> {
  const user = await requireAdmin()

  const adminClient = createAdminClient()
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    return { success: false, error: "BLOB_READ_WRITE_TOKEN no está configurado" }
  }

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "-")

  // Insert history row as "running"
  const { data: historyRow, error: historyError } = await adminClient
    .from("backup_history")
    .insert({
      type: "manual",
      backup_scope: scope,
      status: "running",
      created_by_id: user.id,
    })
    .select("id")
    .single()

  if (historyError || !historyRow) {
    return { success: false, error: "No se pudo crear el registro de backup en la base de datos" }
  }

  const backupId = historyRow.id
  const updateHistory = (patch: Record<string, unknown>) =>
    adminClient.from("backup_history").update(patch).eq("id", backupId)

  try {
    // ── DB Backup ────────────────────────────────────────────────────────────
    let blobUrlDb: string | undefined
    let fileNameDb: string | undefined
    let fileSizeDb: number | undefined
    let tablesCount = 0

    if (scope === "db" || scope === "both") {
      const dbExport: Record<string, unknown[]> = {}

      for (const table of DB_TABLES) {
        const { data, error } = await adminClient.from(table).select("*")
        if (!error && data) {
          dbExport[table] = data
          tablesCount++
        }
      }

      const jsonStr = JSON.stringify(
        { exported_at: now.toISOString(), tables: tablesCount, data: dbExport },
        null,
        2,
      )
      const jsonBuffer = Buffer.from(jsonStr, "utf-8")
      fileNameDb = `backup-db-${dateStr}-${timeStr}.json`

      const blob = await put(`backups/db/${fileNameDb}`, jsonBuffer, {
        access: "public",
        token,
        contentType: "application/json",
      })
      blobUrlDb = blob.url
      fileSizeDb = jsonBuffer.byteLength
    }

    // ── Images Backup (ZIP) ──────────────────────────────────────────────────
    let blobUrlImages: string | undefined
    let fileNameImages: string | undefined
    let fileSizeImages: number | undefined
    let imagesCount = 0

    if (scope === "images" || scope === "both") {
      const { data: properties } = await adminClient
        .from("properties")
        .select("id, images")

      const imageEntries: Array<{ propertyId: string; url: string }> = []

      for (const prop of properties ?? []) {
        if (!Array.isArray(prop.images)) continue
        for (const img of prop.images) {
          let parsed = img
          if (typeof img === "string") {
            try { parsed = JSON.parse(img) } catch { parsed = img }
          }
          const url = typeof parsed === "string" ? parsed : parsed?.url
          if (url && typeof url === "string" && url.startsWith("http")) {
            imageEntries.push({ propertyId: prop.id, url })
          }
        }
      }

      const downloaded = await downloadBatch(
        imageEntries.map((e) => e.url),
        IMAGE_CONCURRENCY,
      )

      const zip = new JSZip()
      const imagesFolder = zip.folder("imagenes")!
      const urlToPropertyId = new Map(imageEntries.map((e) => [e.url, e.propertyId]))

      for (const item of downloaded) {
        if (!item.buffer || !item.filename) continue
        const propId = urlToPropertyId.get(item.url) ?? "sin-propiedad"
        const folder = imagesFolder.folder(`propiedad-${propId}`)!
        folder.file(item.filename, item.buffer)
        imagesCount++
      }

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
      fileNameImages = `backup-images-${dateStr}-${timeStr}.zip`

      const blob = await put(`backups/images/${fileNameImages}`, zipBuffer, {
        access: "public",
        token,
        contentType: "application/zip",
      })
      blobUrlImages = blob.url
      fileSizeImages = zipBuffer.byteLength
    }

    // ── Mark completed ───────────────────────────────────────────────────────
    await updateHistory({
      status: "completed",
      blob_url_db: blobUrlDb ?? null,
      blob_url_images: blobUrlImages ?? null,
      file_name_db: fileNameDb ?? null,
      file_name_images: fileNameImages ?? null,
      file_size_db: fileSizeDb ?? null,
      file_size_images: fileSizeImages ?? null,
      tables_count: tablesCount || null,
      images_count: imagesCount || null,
      completed_at: new Date().toISOString(),
    })

    // Enforce retention policy
    const retention = await getSystemSetting("backup_retention")
    if (retention) await enforceRetentionInternal(parseInt(retention, 10), adminClient)

    revalidatePath("/settings/tools")
    return { success: true, backupId }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    await updateHistory({ status: "failed", error_message: msg, completed_at: new Date().toISOString() })
    return { success: false, error: msg }
  }
}

// ─── History ──────────────────────────────────────────────────────────────────

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

export async function deleteBackupRecord(id: string): Promise<void> {
  await requireAdmin()
  const adminClient = createAdminClient()
  const { error } = await adminClient.from("backup_history").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/settings/tools")
}

async function enforceRetentionInternal(maxBackups: number, client: ReturnType<typeof createAdminClient>) {
  const { data } = await client
    .from("backup_history")
    .select("id")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
  if (!data || data.length <= maxBackups) return
  const toDelete = data.slice(maxBackups).map((r: any) => r.id)
  await client.from("backup_history").delete().in("id", toDelete)
}

export async function enforceRetention(maxBackups: number): Promise<void> {
  await requireAdmin()
  await enforceRetentionInternal(maxBackups, createAdminClient())
  revalidatePath("/settings/tools")
}

// ─── Settings ─────────────────────────────────────────────────────────────────

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
