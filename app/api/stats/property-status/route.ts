import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statusCounts = await prisma.property.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    })

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
      name: statusLabels[item.status],
      value: item._count.status,
      color: statusColors[item.status],
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching property status stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
