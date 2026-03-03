import { getCurrentUser } from "@/lib/auth"
import { getDashboardStats } from "@/lib/actions/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, UserCircle, Calendar, Home } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
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
        <Card className="border-l-4 border-l-blue-500 bg-linear-to-br from-blue-50/50 to-background dark:from-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dashboardData.stats.totalProperties}
            </div>
            <p className="text-xs text-muted-foreground">{dashboardData.stats.activeProperties} activas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-linear-to-br from-green-50/50 to-background dark:from-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades Activas</CardTitle>
            <Home className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {dashboardData.stats.activeProperties}
            </div>
            <p className="text-xs text-muted-foreground">Listas para venta/alquiler</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-linear-to-br from-amber-50/50 to-background dark:from-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {dashboardData.stats.totalClients}
            </div>
            <p className="text-xs text-muted-foreground">Total de clientes registrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-linear-to-br from-purple-50/50 to-background dark:from-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
            <UserCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {dashboardData.stats.totalOwners}
            </div>
            <p className="text-xs text-muted-foreground">Total de propietarios</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 bg-linear-to-br from-rose-50/50 to-background dark:from-rose-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Próximas</CardTitle>
            <Calendar className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {dashboardData.stats.upcomingAppointments}
            </div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts
        propertyTypes={dashboardData.charts.propertyTypes}
        transactionTypes={dashboardData.charts.transactionTypes}
        agentRanking={dashboardData.charts.agentRanking}
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
