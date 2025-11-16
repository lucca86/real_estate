import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: properties, error } = await supabase
      .from("properties")
      .select("status")
    
    if (error) throw error

    // Count by status manually
    const statusCounts = properties.reduce((acc: any, prop: any) => {
      const status = prop.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    const statusColors: Record<string, string> = {
      ACTIVO: "hsl(142, 76%, 36%)",
      RESERVADO: "hsl(48, 96%, 53%)",
      VENDIDO: "hsl(221, 83%, 53%)",
      ALQUILADO: "hsl(271, 81%, 56%)",
      ELIMINADO: "hsl(0, 84%, 60%)",
      EN_REVISION: "hsl(25, 95%, 53%)",
    }

    const statusLabels: Record<string, string> = {
      ACTIVO: "Activo",
      RESERVADO: "Reservado",
      VENDIDO: "Vendido",
      ALQUILADO: "Alquilado",
      ELIMINADO: "Eliminado",
      EN_REVISION: "En Revisión",
    }

    const data = Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      color: statusColors[status] || "hsl(0, 0%, 50%)",
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching property status stats:", error)
    return NextResponse.json([])
  }
}
