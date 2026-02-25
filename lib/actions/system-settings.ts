"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit"

export type PropertyEditMode = "open" | "restricted"

export async function getSystemSetting(key: string): Promise<string | null> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .single()
  return data?.value ?? null
}

export async function getPropertyEditMode(): Promise<PropertyEditMode> {
  const value = await getSystemSetting("property_edit_mode")
  return (value === "restricted" ? "restricted" : "open") as PropertyEditMode
}

export async function updateSystemSetting(key: string, value: string) {
  const user = await getCurrentUser()
  if (!user || !isAdmin(user)) {
    return { success: false, error: "Sin permisos" }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by_id: user.id })

  if (error) {
    return { success: false, error: error.message }
  }

  await logAudit({
    module: "settings",
    action: "update",
    entity_type: "Configuración",
    entity_id: key,
    metadata: { key, value },
  })

  revalidatePath("/settings")
  return { success: true }
}
