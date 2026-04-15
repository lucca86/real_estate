"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const supabase = await createAdminClient()

  try {
    const { count: totalProperties } = await supabase.from("Property").select("*", { count: "exact", head: true })

    const { count: activeProperties } = await supabase
      .from("Property")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVO")

    const { count: totalClients } = await supabase.from("Client").select("*", { count: "exact", head: true })

    const { count: totalOwners } = await supabase.from("Owner").select("*", { count: "exact", head: true })

    const { count: upcomingAppointments } = await supabase
      .from("Appointment")
      .select("*", { count: "exact", head: true })
      .gte("scheduledAt", new Date().toISOString())
      .not("status", "eq", "CANCELADA")

    const { data: propertiesByType } = await supabase.from("Property").select(`
        propertyTypeId,
        propertyType:PropertyType!propertyTypeId(name)
      `)

    const propertyTypeCounts = propertiesByType?.reduce((acc: Record<string, number>, prop) => {
      const typeName = (prop.propertyType as any)?.name || "Sin Tipo"
      acc[typeName] = (acc[typeName] || 0) + 1
      return acc
    }, {})

    const { data: propertiesByTransaction } = await supabase.from("Property").select("transactionType")

    const transactionCounts = propertiesByTransaction?.reduce((acc: Record<string, number>, prop) => {
      const transactionName: string = (prop as any).transactionType || "Sin Definir"
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
      .from("Property")
      .select("createdById")
      .not("createdById", "is", null)

    const agentIdCounts: Record<string, number> = {}
    propertiesByAgent?.forEach((p: any) => {
      if (p.createdById) {
        agentIdCounts[p.createdById] = (agentIdCounts[p.createdById] || 0) + 1
      }
    })

    const agentIds = Object.keys(agentIdCounts)
    let agentRanking: { name: string; count: number }[] = []

    if (agentIds.length > 0) {
      const { data: agentUsers } = await supabase
        .from("User")
        .select("id, name")
        .in("id", agentIds)

      agentRanking = (agentUsers || [])
        .map((u: any) => ({ name: u.name, count: agentIdCounts[u.id] || 0 }))
        .sort((a, b) => b.count - a.count)
    }

    const { data: recentProperties } = await supabase
      .from("Property")
      .select(`
        id,
        title,
        price,
        currency,
        createdAt,
        propertyType:PropertyType!propertyTypeId(name),
        city:City!cityId(name)
      `)
      .order("createdAt", { ascending: false })
      .limit(5)

    const transformedRecentProperties =
      recentProperties?.map((prop: any) => ({
        id: prop.id,
        title: prop.title,
        price: prop.price,
        currency: prop.currency,
        created_at: prop.createdAt,
        property_types: prop.propertyType || null,
        cities: prop.city || null,
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
