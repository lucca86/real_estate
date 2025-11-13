import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const properties = (await Promise.race([
      prisma.property.findMany({
        where: {
          status: { in: ["VENDIDO", "ALQUILADO"] },
          updatedAt: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          price: true,
          updatedAt: true,
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), 10000)),
    ])) as any[]

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    const revenueByMonth = properties.reduce(
      (acc, property) => {
        const month = property.updatedAt.getMonth()
        const year = property.updatedAt.getFullYear()
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
