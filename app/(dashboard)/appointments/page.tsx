import { Suspense } from "react"
import { getAppointments } from "@/lib/actions/appointments"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AppointmentsCalendar } from "@/components/appointments-calendar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function AppointmentsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getAppointments()

  if (!result.success || !result.data) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Citas</h1>
            <p className="text-muted-foreground">Gestiona las visitas a propiedades</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Error al cargar las citas</p>
        </div>
      </DashboardLayout>
    )
  }

  const appointments = result.data

  return (
    <DashboardLayout user={user}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Citas</h1>
          <p className="text-muted-foreground">Gestiona las visitas a propiedades</p>
        </div>
        <Link href="/appointments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando calendario...</div>}>
        <AppointmentsCalendar appointments={appointments} />
      </Suspense>
    </DashboardLayout>
  )
}
