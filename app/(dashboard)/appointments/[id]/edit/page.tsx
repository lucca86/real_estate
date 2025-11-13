import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { AppointmentForm } from "@/components/appointment-form"
import { getAppointmentById } from "@/lib/actions/appointments"
import { db } from "@/lib/db"

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getAppointmentById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const appointment = result.data

  const [propertiesRaw, clients, agents] = await Promise.all([
    db.property.findMany({
      select: { id: true, title: true, address: true, city: { select: { name: true } } },
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

  const properties = propertiesRaw.map((p) => ({
    id: p.id,
    title: p.title,
    address: p.address,
    city: p.city?.name || "Sin ciudad",
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Cita</h1>
        <p className="text-muted-foreground">Modifica los detalles de la cita</p>
      </div>

      <AppointmentForm appointment={appointment} properties={properties} clients={clients} agents={agents} />
    </div>
  )
}
