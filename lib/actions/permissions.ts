"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export interface PermissionUpdate {
  role: string
  permission: string
  enabled: boolean
}

export async function updatePermissions(updates: PermissionUpdate[]) {
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    return { error: "No autorizado" }
  }

  const supabase = await createAdminClient()

  try {
    for (const update of updates) {
      // Allow ADMIN users to modify all role permissions including ADMIN

      const { error: upsertError } = await supabase.from("role_permissions").upsert(
        {
          role: update.role,
          permission: update.permission,
          enabled: update.enabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "role,permission",
        },
      )

      if (upsertError) {
        console.error("Error upserting permission:", upsertError)
        return { error: `Error al actualizar permiso ${update.permission}: ${upsertError.message}` }
      }

      // Log to audit table
      await supabase.from("permissions_audit").insert({
        role: update.role,
        permission: update.permission,
        action: update.enabled ? "enabled" : "disabled",
        changed_by: user.id,
      })
    }

    revalidatePath("/settings/permissions")

    return { success: true }
  } catch (error) {
    console.error("Error updating permissions:", error)
    return { error: "Error al actualizar permisos" }
  }
}

export async function resetRolePermissions(role: string) {
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    return { error: "No autorizado" }
  }

  if (role === "ADMIN") {
    return { error: "No se pueden resetear los permisos de ADMIN" }
  }

  const supabase = await createAdminClient()

  try {
    const defaults: Record<string, Record<string, boolean>> = {
      SUPERVISOR: {
        "dashboard.view": true,
        "properties.view": true,
        "properties.create": true,
        "properties.edit": true,
        "properties.delete": true,
        "property_types.view": true,
        "property_types.manage": true,
        "catalog.view": true,
        "map.view": true,
        "owners.view": true,
        "owners.manage": true,
        "clients.view": true,
        "clients.manage": true,
        "contacts.view": true,
        "contacts.manage": true,
        "services.view": true,
        "services.manage": true,
        "appointments.view": true,
        "appointments.manage": true,
        "users.view": true,
        "users.manage": true,
        "locations.view": true,
        "locations.manage": true,
        "settings.view": false,
        "permissions.manage": false,
      },
      VENDEDOR: {
        "dashboard.view": true,
        "properties.view": true,
        "properties.create": true,
        "properties.edit": true,
        "properties.delete": false,
        "property_types.view": true,
        "property_types.manage": false,
        "catalog.view": true,
        "map.view": true,
        "owners.view": true,
        "owners.manage": true,
        "clients.view": true,
        "clients.manage": true,
        "contacts.view": true,
        "contacts.manage": true,
        "services.view": true,
        "services.manage": false,
        "appointments.view": true,
        "appointments.manage": true,
        "users.view": false,
        "users.manage": false,
        "locations.view": true,
        "locations.manage": false,
        "settings.view": false,
        "permissions.manage": false,
      },
    }

    const roleDefaults = defaults[role]
    if (!roleDefaults) {
      return { error: "Rol no válido" }
    }

    // Update all permissions for this role
    for (const [permission, enabled] of Object.entries(roleDefaults)) {
      await supabase
        .from("role_permissions")
        .update({
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("role", role)
        .eq("permission", permission)

      // Log to audit
      await supabase.from("permissions_audit").insert({
        role,
        permission,
        action: `reset_to_${enabled ? "enabled" : "disabled"}`,
        changed_by: user.id,
      })
    }

    revalidatePath("/settings/permissions")

    return { success: true }
  } catch (error) {
    console.error("Error resetting permissions:", error)
    return { error: "Error al resetear permisos" }
  }
}

export async function getPermissionsAudit(limit = 50) {
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    return { error: "No autorizado" }
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("permissions_audit")
    .select(`
      *,
      changed_by_user:users!permissions_audit_changed_by_fkey(name, email)
    `)
    .order("changed_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching audit:", error)
    return { error: "Error al obtener auditoría" }
  }

  return { data }
}
