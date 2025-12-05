import { createClient } from "@supabase/supabase-js"

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

export async function initializePermissions() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials")
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log("[v0] Iniciando inserción de permisos por defecto...")

  for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const permission of permissions) {
      const { data, error } = await supabase.from("role_permissions").upsert(
        {
          role,
          permission,
          granted: true,
        },
        {
          onConflict: "role,permission",
        },
      )

      if (error) {
        console.error(`[v0] Error insertando permiso ${permission} para rol ${role}:`, error)
      } else {
        console.log(`[v0] ✓ Permiso ${permission} asignado a ${role}`)
      }
    }
  }

  console.log("[v0] ✓ Permisos inicializados correctamente")
}

// Si se ejecuta directamente
if (require.main === module) {
  initializePermissions()
    .then(() => {
      console.log("Proceso completado")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error:", error)
      process.exit(1)
    })
}
