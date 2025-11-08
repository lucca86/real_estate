import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const owners = await prisma.owner.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(owners)
  } catch (error) {
    console.error("[v0] Error fetching owners:", error)
    return NextResponse.json({ error: "Error al obtener propietarios" }, { status: 500 })
  }
}
