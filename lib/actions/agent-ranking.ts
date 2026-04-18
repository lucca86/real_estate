"use server"

import { createAdminClient } from "@/lib/supabase/server"

export type RankingPeriod = "week" | "month" | "year" | "all"

export async function getAgentRanking(period: RankingPeriod = "all"): Promise<{ name: string; count: number }[]> {
  const supabase = await createAdminClient()

  const now = new Date()
  let fromDate: string | null = null

  if (period === "week") {
    const from = new Date(now)
    from.setDate(now.getDate() - 7)
    fromDate = from.toISOString()
  } else if (period === "month") {
    const from = new Date(now)
    from.setMonth(now.getMonth() - 1)
    fromDate = from.toISOString()
  } else if (period === "year") {
    const from = new Date(now)
    from.setFullYear(now.getFullYear() - 1)
    fromDate = from.toISOString()
  }

  let query = supabase
    .from("properties")
    .select("created_by_id, created_at")
    .not("created_by_id", "is", null)

  if (fromDate) {
    query = query.gte("created_at", fromDate)
  }

  const { data: propertiesByAgent } = await query

  const agentIdCounts: Record<string, number> = {}
  propertiesByAgent?.forEach((p: any) => {
    if (p.created_by_id) {
      agentIdCounts[p.created_by_id] = (agentIdCounts[p.created_by_id] || 0) + 1
    }
  })

  const agentIds = Object.keys(agentIdCounts)
  if (agentIds.length === 0) return []

  const { data: agentUsers } = await supabase
    .from("users")
    .select("id, name")
    .in("id", agentIds)

  return (agentUsers || [])
    .map((u: any) => ({ name: u.name, count: agentIdCounts[u.id] || 0 }))
    .sort((a, b) => b.count - a.count)
}
