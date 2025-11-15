import { Building2, DollarSign, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerClient } from "@/lib/supabase/server"

export async function DashboardStats() {
  console.log("[v0] DashboardStats: Starting to fetch stats")

  try {
    const supabase = await createServerClient()

    const [
      { count: totalProperties },
      { count: availableProperties },
      { data: revenueData },
      { count: totalUsers }
    ] = await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVO'),
      supabase.from('properties').select('price').in('status', ['VENDIDO', 'ALQUILADO']),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ])

    const totalRevenue = revenueData?.reduce((sum, prop) => sum + (prop.price || 0), 0) || 0

    const stats = [
      {
        title: "Total Propiedades",
        value: totalProperties || 0,
        icon: Building2,
        description: `${availableProperties || 0} disponibles`,
      },
      {
        title: "Ingresos Totales",
        value: `$${totalRevenue.toLocaleString()}`,
        icon: DollarSign,
        description: "De ventas y alquileres",
      },
      {
        title: "Propiedades Activas",
        value: availableProperties || 0,
        icon: TrendingUp,
        description: "Listas para venta/alquiler",
      },
      {
        title: "Usuarios Activos",
        value: totalUsers || 0,
        icon: Users,
        description: "En el sistema",
      },
    ]

    console.log("[v0] DashboardStats: Successfully fetched stats")

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
