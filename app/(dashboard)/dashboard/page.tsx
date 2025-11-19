import { getCurrentUser } from "@/lib/auth"
import { getDashboardStats } from "@/lib/actions/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, UserCircle, Calendar, Home } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from 'next/navigation'
import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentProperties } from "@/components/recent-properties"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const dashboardData = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido de vuelta, {user.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.stats.activeProperties} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades Activas</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeProperties}</div>
            <p className="text-xs text-muted-foreground">Listas para venta/alquiler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Total de clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalOwners}</div>
            <p className="text-xs text-muted-foreground">Total de propietarios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Próximas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts
        propertyTypes={dashboardData.charts.propertyTypes}
        cities={dashboardData.charts.cities}
      />

      <RecentProperties properties={dashboardData.recentProperties} />

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona tu negocio inmobiliario</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/properties/new">Nueva Propiedad</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/clients/new">Nuevo Cliente</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/appointments/new">Nueva Cita</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/properties">Ver Propiedades</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
