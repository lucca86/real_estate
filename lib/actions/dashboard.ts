"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function getAgentRanking(period: "week" | "month" | "year" | "all" = "week") {
  const supabase = await createAdminClient()

  try {
    let fromDate: string | null = null
    const now = new Date()

    if (period === "week") {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      fromDate = d.toISOString()
    } else if (period === "month") {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      fromDate = d.toISOString()
    } else if (period === "year") {
      const d = new Date(now)
      d.setFullYear(d.getFullYear() - 1)
      fromDate = d.toISOString()
    }

    let query = supabase
      .from("properties")
      .select("created_by_id, users!created_by_id(name)")

    if (fromDate) {
      query = query.gte("created_at", fromDate)
    }

    const { data, error } = await query

    if (error || !data) return []

    // Agrupar por usuario
    const counts: Record<string, { name: string; count: number }> = {}
    for (const row of data) {
      const userId = row.created_by_id
      if (!userId) continue
      const name = (row.users as any)?.name || "Sin nombre"
      if (!counts[userId]) counts[userId] = { name, count: 0 }
      counts[userId].count++
    }

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  } catch (error) {
    console.error("[getAgentRanking] Error:", error)
    return []
  }
}

export async function getDashboardStats() {
  const supabase = await createAdminClient()

  try {
    const { count: totalProperties } = await supabase.from("properties").select("*", { count: "exact", head: true })

    const { count: activeProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    const { count: totalClients } = await supabase.from("clients").select("*", { count: "exact", head: true })

    const { count: totalOwners } = await supabase.from("owners").select("*", { count: "exact", head: true })

    const { count: upcomingAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .in("status", ["PENDIENTE", "CONFIRMADA"])
      .gte("scheduled_date", new Date().toISOString().split("T")[0])

    const { data: propertiesByType } = await supabase.from("properties").select(`
        property_type_id,
        property_types!inner(name)
      `)

    const propertyTypeCounts = propertiesByType?.reduce((acc: Record<string, number>, prop) => {
      const typeName = (prop.property_types as any)?.name || "Sin Tipo"
      acc[typeName] = (acc[typeName] || 0) + 1
      return acc
    }, {})

    const { data: propertiesByTransaction } = await supabase.from("properties").select("transaction_type")

    const transactionCounts = propertiesByTransaction?.reduce((acc: Record<string, number>, prop) => {
      const transactionName: string = prop.transaction_type || "Sin Definir"
      const translationMap: Record<string, string> = {
        VENTA: "Venta",
        ALQUILER: "Alquiler",
        VENTA_ALQUILER: "Venta/Alquiler",
        ALQUILER_OPCION_COMPRA: "Alquiler con Opción a Compra",
      }
      const translatedName = translationMap[transactionName] || transactionName

      acc[translatedName] = (acc[translatedName] || 0) + 1
      return acc
    }, {})

    const { data: recentProperties } = await supabase
      .from("properties")
      .select(`
        id,
        title,
        price,
        currency,
        created_at,
        propertyType:property_types!property_type_id(name),
        city:cities!city_id(name)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    const transformedRecentProperties =
      recentProperties?.map((prop: any) => ({
        id: prop.id,
        title: prop.title,
        price: prop.price,
        currency: prop.currency,
        created_at: prop.created_at,
        property_types: prop.propertyType || null,
        cities: prop.city || null,
      })) || []

    const chartData = {
      propertyTypes: Object.entries(propertyTypeCounts ?? {}).map(([name, count]) => ({
        name,
        count: count as number,
      })),
      transactionTypes: Object.entries(transactionCounts ?? {}).map(([name, count]) => ({
        name,
        count: count as number,
      })),
    }

    return {
      stats: {
        totalProperties: totalProperties || 0,
        activeProperties: activeProperties || 0,
        totalClients: totalClients || 0,
        totalOwners: totalOwners || 0,
        upcomingAppointments: upcomingAppointments || 0,
      },
      charts: chartData,
      recentProperties: transformedRecentProperties,
    }
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return {
      stats: {
        totalProperties: 0,
        activeProperties: 0,
        totalClients: 0,
        totalOwners: 0,
        upcomingAppointments: 0,
      },
      charts: {
        propertyTypes: [],
        transactionTypes: [],
      },
      recentProperties: [],
    }
  }
}
