import { Building2, DollarSign, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/db"

export async function DashboardStats() {
  console.log("[v0] DashboardStats: Starting to fetch stats")

  try {
    const statsPromise = Promise.all([
      prisma.property.count(),
      prisma.property.count({
        where: { status: "ACTIVO" },
      }),
      prisma.property.aggregate({
        where: {
          status: { in: ["VENDIDO", "ALQUILADO"] },
        },
        _sum: {
          price: true,
        },
      }),
      prisma.user.count({
        where: { isActive: true },
      }),
    ])

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Stats query timeout")), 5000))

    const [totalProperties, availableProperties, totalRevenue, totalUsers] = (await Promise.race([
      statsPromise,
      timeoutPromise,
    ])) as any

    console.log("[v0] DashboardStats: Successfully fetched stats")

    const stats = [
      {
        title: "Total Propiedades",
        value: totalProperties,
        icon: Building2,
        description: `${availableProperties} disponibles`,
      },
      {
        title: "Ingresos Totales",
        value: `$${(totalRevenue._sum.price || 0).toLocaleString()}`,
        icon: DollarSign,
        description: "De ventas y alquileres",
      },
      {
        title: "Propiedades Activas",
        value: availableProperties,
        icon: TrendingUp,
        description: "Listas para venta/alquiler",
      },
      {
        title: "Usuarios Activos",
        value: totalUsers,
        icon: Users,
        description: "En el sistema",
      },
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  } catch (error) {
    console.error("[v0] DashboardStats: Error fetching stats:", error)

    // Return placeholder stats
    const placeholderStats = [
      { title: "Total Propiedades", value: 0, icon: Building2, description: "0 disponibles" },
      { title: "Ingresos Totales", value: "$0", icon: DollarSign, description: "De ventas y alquileres" },
      { title: "Propiedades Activas", value: 0, icon: TrendingUp, description: "Listas para venta/alquiler" },
      { title: "Usuarios Activos", value: 0, icon: Users, description: "En el sistema" },
    ]

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {placeholderStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}
