import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from "@/lib/auth"
import { AppointmentForm } from "@/components/appointment-form"
import { getAppointmentById } from "@/lib/actions/appointments"
import { createServerClient } from "@/lib/supabase/server"

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

  const supabase = await createServerClient()

  const [propertiesResult, clientsResult, agentsResult] = await Promise.all([
    supabase
      .from("properties")
      .select("id, title, address, cities!city_id(name)")
      .order("title", { ascending: true }),
    supabase
      .from("clients")
      .select("id, name, email, phone")
      .order("name", { ascending: true }),
    supabase
      .from("users")
      .select("id, name, email")
      .in("role", ["ADMIN", "SUPERVISOR", "VENDEDOR"])
      .order("name", { ascending: true }),
  ])

  const properties = (propertiesResult.data || []).map((p) => ({
    id: p.id,
    title: p.title,
    address: p.address,
    city: p.cities?.[0]?.name || "Sin ciudad",
  }))

  const clients = clientsResult.data || []
  const agents = agentsResult.data || []

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
