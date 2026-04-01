export type Permission = string

export interface PermissionGroup {
  name: string
  label: string
  permissions: {
    key: Permission
    label: string
    description?: string
  }[]
}

// Define all permission groups
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "dashboard.view", label: "Ver Dashboard", description: "Acceso al panel principal" }],
  },
  {
    name: "properties",
    label: "Propiedades",
    permissions: [
      { key: "properties.view", label: "Ver", description: "Ver listado de propiedades" },
      { key: "properties.create", label: "Crear", description: "Crear nuevas propiedades" },
      { key: "properties.edit", label: "Editar", description: "Modificar propiedades existentes" },
      { key: "properties.delete", label: "Eliminar", description: "Eliminar propiedades" },
    ],
  },
  {
    name: "property_types",
    label: "Tipos de Propiedad",
    permissions: [
      { key: "property_types.view", label: "Ver", description: "Ver tipos de propiedad" },
      { key: "property_types.manage", label: "Gestionar", description: "Crear, editar y eliminar tipos" },
    ],
  },
  {
    name: "catalog",
    label: "Catálogo",
    permissions: [{ key: "catalog.view", label: "Ver Catálogo", description: "Acceso al catálogo de propiedades" }],
  },
  {
    name: "map",
    label: "Mapa",
    permissions: [{ key: "map.view", label: "Ver Mapa", description: "Visualizar propiedades en el mapa" }],
  },
  {
    name: "owners",
    label: "Propietarios",
    permissions: [
      { key: "owners.view", label: "Ver", description: "Ver listado de propietarios" },
      { key: "owners.manage", label: "Gestionar", description: "Crear, editar y eliminar propietarios" },
    ],
  },
  {
    name: "clients",
    label: "Clientes",
    permissions: [
      { key: "clients.view", label: "Ver", description: "Ver listado de clientes" },
      { key: "clients.manage", label: "Gestionar", description: "Crear, editar y eliminar clientes" },
    ],
  },
  {
    name: "contacts",
    label: "Agenda de Contactos",
    permissions: [
      { key: "contacts.view", label: "Ver", description: "Ver agenda de contactos" },
      { key: "contacts.manage", label: "Gestionar", description: "Crear, editar y eliminar contactos" },
    ],
  },
  {
    name: "services",
    label: "Servicios",
    permissions: [
      { key: "services.view", label: "Ver", description: "Ver listado de servicios" },
      { key: "services.manage", label: "Gestionar", description: "Crear, editar y eliminar servicios" },
    ],
  },
  {
    name: "appointments",
    label: "Citas",
    permissions: [
      { key: "appointments.view", label: "Ver", description: "Ver agenda de citas" },
      { key: "appointments.create", label: "Crear", description: "Crear nuevas citas" },
      { key: "appointments.edit", label: "Editar", description: "Editar citas existentes" },
      { key: "appointments.delete", label: "Eliminar", description: "Eliminar citas (solo administradores)" },
    ],
  },
  {
    name: "users",
    label: "Usuarios",
    permissions: [
      { key: "users.view", label: "Ver", description: "Ver listado de usuarios" },
      { key: "users.manage", label: "Gestionar", description: "Crear, editar y eliminar usuarios" },
    ],
  },
  {
    name: "locations",
    label: "Ubicaciones",
    permissions: [
      { key: "locations.view", label: "Ver", description: "Ver ubicaciones (ciudades y barrios)" },
      { key: "locations.manage", label: "Gestionar", description: "Crear, editar y eliminar ubicaciones" },
    ],
  },
  {
    name: "settings",
    label: "Configuración",
    permissions: [
      { key: "settings.view", label: "Ver Configuración", description: "Acceso a configuración del sistema" },
    ],
  },
  {
    name: "permissions",
    label: "Permisos",
    permissions: [
      { key: "permissions.manage", label: "Gestionar Permisos", description: "Administrar permisos de roles" },
    ],
  },
]

// Get all permissions as a flat array
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((p) => p.key))
