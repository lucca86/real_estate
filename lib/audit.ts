import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { headers } from "next/headers"

export type AuditModule =
  | "users"
  | "properties"
  | "property_types"
  | "owners"
  | "clients"
  | "contacts"
  | "services"
  | "appointments"
  | "locations"
  | "permissions"
  | "settings"

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "sync"
  | "restore"
  | "enable"
  | "disable"

export interface AuditLogEntry {
  id: string
  module: AuditModule
  action: AuditAction
  entity_type: string
  entity_id?: string
  user_id?: string
  user_name?: string
  user_role?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface AuditLogFilters {
  module?: AuditModule
  action?: AuditAction
  user_id?: string
  start_date?: string
  end_date?: string
  search?: string
}

/**
 * Records an audit log entry
 */
export async function logAudit(params: {
  module: AuditModule
  action: AuditAction
  entity_type: string
  entity_id?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
}) {
  try {
    const supabase = await createAdminClient()
    const user = await getCurrentUser()
    const headersList = await headers()

    const ip_address = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined
    const user_agent = headersList.get("user-agent") || undefined

    const { error } = await supabase.from("audit_logs").insert({
      module: params.module,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      user_id: user?.id,
      user_name: user?.name,
      user_role: user?.role,
      changes: params.changes,
      metadata: params.metadata,
      ip_address,
      user_agent,
    })

    if (error) {
      console.error("[v0] Error logging audit:", error)
    }
  } catch (error) {
    console.error("[v0] Error logging audit:", error)
  }
}

/**
 * Gets audit logs with filters
 */
export async function getAuditLogs(filters?: AuditLogFilters, limit = 100, offset = 0) {
  const supabase = await createServerClient()

  let query = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false })

  if (filters?.module) {
    query = query.eq("module", filters.module)
  }

  if (filters?.action) {
    query = query.eq("action", filters.action)
  }

  if (filters?.user_id) {
    query = query.eq("user_id", filters.user_id)
  }

  if (filters?.start_date) {
    query = query.gte("created_at", filters.start_date)
  }

  if (filters?.end_date) {
    query = query.lte("created_at", filters.end_date)
  }

  if (filters?.search) {
    query = query.or(
      `user_name.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%,entity_id.ilike.%${filters.search}%`,
    )
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error("[v0] Error fetching audit logs:", error)
    return { data: [], count: 0, error }
  }

  return { data: data as AuditLogEntry[], count: count || 0, error: null }
}

/**
 * Gets audit statistics
 */
export async function getAuditStats() {
  const supabase = await createServerClient()

  // Get total logs count
  const { count: totalLogs } = await supabase.from("audit_logs").select("*", { count: "exact", head: true })

  // Get logs by module
  const { data: moduleStats } = await supabase
    .from("audit_logs")
    .select("module")
    .order("created_at", { ascending: false })
    .limit(1000)

  // Get logs by action
  const { data: actionStats } = await supabase
    .from("audit_logs")
    .select("action")
    .order("created_at", { ascending: false })
    .limit(1000)

  // Get recent active users
  const { data: recentUsers } = await supabase
    .from("audit_logs")
    .select("user_id, user_name, user_role")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(100)

  // Count by module
  const moduleCounts: Record<string, number> = {}
  moduleStats?.forEach((log) => {
    moduleCounts[log.module] = (moduleCounts[log.module] || 0) + 1
  })

  // Count by action
  const actionCounts: Record<string, number> = {}
  actionStats?.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
  })

  // Unique users
  const uniqueUsers = new Set(recentUsers?.map((u) => u.user_id).filter(Boolean))

  return {
    totalLogs: totalLogs || 0,
    moduleCounts,
    actionCounts,
    activeUsers: uniqueUsers.size,
  }
}
