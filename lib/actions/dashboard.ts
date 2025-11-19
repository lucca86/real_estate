"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function getDashboardStats() {
  const supabase = await createServerClient()

  try {
    const { count: totalProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })

    const { count: activeProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    const { count: totalClients } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })

    const { count: totalOwners } = await supabase
      .from("owners")
      .select("*", { count: "exact", head: true })

    const { count: upcomingAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("date", new Date().toISOString())

    const { data: propertiesByType } = await supabase
      .from("properties")
      .select(`
        property_type_id,
        property_types!inner(name)
      `)

    const propertyTypeCounts = propertiesByType?.reduce((acc: Record<string, number>, prop) => {
      const typeName = (prop.property_types as any)?.name || "Sin Tipo"
      acc[typeName] = (acc[typeName] || 0) + 1
      return acc
    }, {})

    const { data: propertiesByCity } = await supabase
      .from("properties")
      .select(`
        city_id,
        cities!inner(name)
      `)
      .limit(10)

    const cityCounts = propertiesByCity?.reduce((acc: Record<string, number>, prop) => {
      const cityName = (prop.cities as any)?.name || "Sin Ciudad"
      acc[cityName] = (acc[cityName] || 0) + 1
      return acc
    }, {})

    const { data: recentProperties } = await supabase
      .from("properties")
      .select(`
        id,
        title,
        price,
        created_at,
        property_types(name),
        cities(name)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    const transformedRecentProperties = recentProperties?.map((prop: any) => ({
      id: prop.id,
      title: prop.title,
      price: prop.price,
      created_at: prop.created_at,
      property_types: prop.property_types?.[0] || null,
      cities: prop.cities?.[0] || null,
    })) || []

    return {
      stats: {
        totalProperties: totalProperties || 0,
        activeProperties: activeProperties || 0,
        totalClients: totalClients || 0,
        totalOwners: totalOwners || 0,
        upcomingAppointments: upcomingAppointments || 0,
      },
      charts: {
        propertyTypes: Object.entries(propertyTypeCounts || {}).map(([name, count]) => ({
          name,
          count,
        })),
        cities: Object.entries(cityCounts || {}).slice(0, 5).map(([name, count]) => ({
          name,
          count,
        })),
      },
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
        cities: [],
      },
      recentProperties: [],
    }
  }
}
