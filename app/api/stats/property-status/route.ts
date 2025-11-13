import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const statusCounts = (await Promise.race([
      prisma.property.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), 10000)),
    ])) as any[]

    const statusColors = {
      ACTIVO: "hsl(142, 76%, 36%)",
      RESERVADO: "hsl(48, 96%, 53%)",
      VENDIDO: "hsl(221, 83%, 53%)",
      ALQUILADO: "hsl(271, 81%, 56%)",
      ELIMINADO: "hsl(0, 84%, 60%)",
      EN_REVISION: "hsl(25, 95%, 53%)",
    }

    const statusLabels = {
      ACTIVO: "Activo",
      RESERVADO: "Reservado",
      VENDIDO: "Vendido",
      ALQUILADO: "Alquilado",
      ELIMINADO: "Eliminado",
      EN_REVISION: "En Revisión",
    }

    const data = statusCounts.map((item) => ({
      name: statusLabels[item.status as keyof typeof statusLabels],
      value: item._count.status,
      color: statusColors[item.status as keyof typeof statusColors],
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching property status stats:", error)
    return NextResponse.json([])
  }
}
