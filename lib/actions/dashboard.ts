"use server"

import { createAdminClient } from "@/lib/supabase/server"

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
      .gte("scheduled_date", new Date().toISOString())
      .not("status", "eq", "CANCELADA")

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

    // Ranking of agents by properties created
    const { data: propertiesByAgent } = await supabase
      .from("properties")
      .select("created_by_id")
      .not("created_by_id", "is", null)

    const agentIdCounts: Record<string, number> = {}
    propertiesByAgent?.forEach((p: any) => {
      if (p.created_by_id) {
        agentIdCounts[p.created_by_id] = (agentIdCounts[p.created_by_id] || 0) + 1
      }
    })

    const agentIds = Object.keys(agentIdCounts)
    let agentRanking: { name: string; count: number }[] = []

    if (agentIds.length > 0) {
      const { data: agentUsers } = await supabase
        .from("users")
        .select("id, name")
        .in("id", agentIds)

      agentRanking = (agentUsers || [])
        .map((u: any) => ({ name: u.name, count: agentIdCounts[u.id] || 0 }))
        .sort((a, b) => b.count - a.count)
    }

    const { data: recentProperties } = await supabase
      .from("properties")
      .select(`
        id,
        title,
        price,
        currency,
        created_at,
        property_types(name),
        cities(name)
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
        property_types: prop.property_types?.[0] || null,
        cities: prop.cities?.[0] || null,
      })) || []

    const chartData = {
      propertyTypes: Object.entries(propertyTypeCounts || {}).map(([name, count]) => ({
        name,
        count,
      })),
      transactionTypes: Object.entries(transactionCounts || {}).map(([name, count]) => ({
        name,
        count,
      })),
      agentRanking,
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
  } catch {
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
        agentRanking: [],
      },
      recentProperties: [],
    }
  }
}
