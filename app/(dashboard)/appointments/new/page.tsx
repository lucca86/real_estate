import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppointmentForm } from "@/components/appointment-form"
import { db } from "@/lib/db"

export default async function NewAppointmentPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const [propertiesRaw, clients, agents] = await Promise.all([
    db.property.findMany({
      where: { status: "ACTIVO" },
      select: { id: true, title: true, address: true, city: { select: { name: true } } },
      orderBy: { title: "asc" },
    }),
    db.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPERVISOR", "VENDEDOR"] },
        isActive: true,
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
        <h1 className="text-3xl font-bold">Nueva Cita</h1>
        <p className="text-muted-foreground">Agenda una visita a una propiedad</p>
      </div>

      <AppointmentForm properties={properties} clients={clients} agents={agents} />
    </div>
  )
}
