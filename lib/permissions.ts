import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { PERMISSION_GROUPS, ALL_PERMISSIONS, type Permission } from "./permissions-config"

// Re-export for convenience
export { PERMISSION_GROUPS, ALL_PERMISSIONS, type Permission }

// Check if user has a specific permission
export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  // Admin always has all permissions
  if (user.role === "ADMIN") {
    return true
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("role_permissions")
    .select("enabled")
    .eq("role", user.role)
    .eq("permission", permission)
    .single()

  if (error || !data) {
    return false
  }

  return data.enabled
}

// Check multiple permissions at once
export async function checkPermissions(permissions: Permission[]): Promise<Record<Permission, boolean>> {
  const user = await getCurrentUser()

  if (!user) {
    return permissions.reduce((acc, p) => ({ ...acc, [p]: false }), {})
  }

  // Admin always has all permissions
  if (user.role === "ADMIN") {
    return permissions.reduce((acc, p) => ({ ...acc, [p]: true }), {})
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("role_permissions")
    .select("permission, enabled")
    .eq("role", user.role)
    .in("permission", permissions)

  if (error || !data) {
    return permissions.reduce((acc, p) => ({ ...acc, [p]: false }), {})
  }

  const permissionsMap = data.reduce(
    (acc, item) => ({
      ...acc,
      [item.permission]: item.enabled,
    }),
    {} as Record<Permission, boolean>,
  )

  // Fill in missing permissions as false
  return permissions.reduce(
    (acc, p) => ({
      ...acc,
      [p]: permissionsMap[p] || false,
    }),
    {},
  )
}

// Get all permissions for a role
export async function getRolePermissions(role: string): Promise<Record<Permission, boolean>> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("role_permissions").select("permission, enabled").eq("role", role)

  if (error || !data) {
    return {}
  }

  return data.reduce(
    (acc, item) => ({
      ...acc,
      [item.permission]: item.enabled,
    }),
    {} as Record<Permission, boolean>,
  )
}

// Get all permissions for a user by their ID
export async function getUserPermissions(userId: string): Promise<Record<string, boolean>> {
  const supabase = await createAdminClient()

  // Get user role
  const { data: userData, error: userError } = await supabase.from("User").select("role").eq("id", userId).single()

  if (userError || !userData) {
    return {}
  }

  // Admin always has all permissions
  if (userData.role === "ADMIN") {
    return ALL_PERMISSIONS.reduce(
      (acc, p) => ({
        ...acc,
        [p]: true,
      }),
      {},
    )
  }

  // Get role permissions
  return getRolePermissions(userData.role)
}

// Check if a specific user has a permission
export async function hasUserPermission(userId: string, permission: Permission): Promise<boolean> {
  const supabase = await createAdminClient()

  // Get user role
  const { data: userData, error: userError } = await supabase.from("User").select("role").eq("id", userId).single()

  if (userError || !userData) {
    return false
  }

  // Admin always has all permissions
  if (userData.role === "ADMIN") {
    return true
  }

  // Check if role has the permission
  const { data, error } = await supabase
    .from("role_permissions")
    .select("enabled")
    .eq("role", userData.role)
    .eq("permission", permission)
    .single()

  if (error || !data) {
    return false
  }

  return data.enabled
}
