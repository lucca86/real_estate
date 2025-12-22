import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Definición de permisos por defecto para cada rol
const DEFAULT_PERMISSIONS = {
  ADMIN: [
    "dashboard.view",
    "properties.view",
    "properties.create",
    "properties.edit",
    "properties.delete",
    "property_types.view",
    "property_types.manage",
    "catalog.view",
    "map.view",
    "owners.view",
    "owners.manage",
    "clients.view",
    "clients.manage",
    "contacts.view",
    "contacts.manage",
    "services.view",
    "services.manage",
    "appointments.view",
    "appointments.manage",
    "users.view",
    "users.manage",
    "locations.view",
    "locations.manage",
    "settings.view",
    "permissions.manage",
  ],
  SUPERVISOR: [
    "dashboard.view",
    "properties.view",
    "properties.create",
    "properties.edit",
    "property_types.view",
    "catalog.view",
    "map.view",
    "owners.view",
    "clients.view",
    "clients.manage",
    "contacts.view",
    "contacts.manage",
    "services.view",
    "appointments.view",
    "appointments.manage",
    "users.view",
    "locations.view",
    "settings.view",
  ],
  AGENTE_INMOBILIARIO: [
    "dashboard.view",
    "properties.view",
    "catalog.view",
    "map.view",
    "clients.view",
    "contacts.view",
    "services.view",
    "appointments.view",
    "appointments.manage",
    "settings.view",
  ],
}

export async function POST() {
  try {
    const supabase = await createAdminClient()

    // Verificar que el usuario sea ADMIN
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores pueden inicializar permisos" }, { status: 403 })
    }

    const results = []

    for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
      for (const permission of permissions) {
        const { error } = await supabase.from("role_permissions").upsert(
          {
            role,
            permission,
            enabled: true,
          },
          {
            onConflict: "role,permission",
          },
        )

        if (error) {
          results.push({
            role,
            permission,
            success: false,
            error: error.message,
          })
        } else {
          results.push({ role, permission, success: true })
        }
      }
    }

    const successCount = results.filter((r) => r.success).length
    const errorCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      message: "Inicialización completada",
      successCount,
      errorCount,
      details: results,
    })
  } catch (error) {
    console.error("Error inicializando permisos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
