import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const supabase = await createServerClient()
    
    const { data: properties, error } = await supabase
      .from("properties")
      .select("price, updated_at")
      .in("status", ["VENDIDO", "ALQUILADO"])
      .gte("updated_at", sixMonthsAgo.toISOString())

    if (error) throw error

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    const revenueByMonth = (properties || []).reduce(
      (acc, property) => {
        const updatedAt = new Date(property.updated_at)
        const month = updatedAt.getMonth()
        const year = updatedAt.getFullYear()
        const key = `${monthNames[month]} ${year}`

        if (!acc[key]) {
          acc[key] = 0
        }

        acc[key] += property.price

        return acc
      },
      {} as Record<string, number>,
    )

    const data = Object.entries(revenueByMonth)
      .map(([month, revenue]) => ({
        month,
        revenue,
      }))
      .slice(-6)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching revenue stats:", error)
    return NextResponse.json([])
  }
}
