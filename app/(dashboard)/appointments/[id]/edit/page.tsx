import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AppointmentForm } from "@/components/appointment-form"
import { getAppointmentById } from "@/lib/actions/appointments"
import { db } from "@/lib/db"

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  console.log("[v0] Edit appointment page - ID:", id)

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getAppointmentById(id)

  console.log("[v0] Appointment loaded:", result.success ? "SUCCESS" : "FAILED", result.data?.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const appointment = result.data

  // Obtener propiedades, clientes y agentes para los selects
  const [properties, clients, agents] = await Promise.all([
    db.property.findMany({
      select: { id: true, title: true, address: true, city: true },
      orderBy: { title: "asc" },
    }),
    db.client.findMany({
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPERVISOR", "VENDEDOR"] },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Editar Cita</h1>
          <p className="text-muted-foreground">Modifica los detalles de la cita</p>
        </div>

        <AppointmentForm appointment={appointment} properties={properties} clients={clients} agents={agents} />
      </div>
    </DashboardLayout>
  )
}
