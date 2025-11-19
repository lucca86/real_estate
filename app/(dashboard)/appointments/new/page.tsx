import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { AppointmentForm } from "@/components/appointment-form"
import { createServerClient } from "@/lib/supabase/server"

export default async function NewAppointmentPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createServerClient()

  const [propertiesResult, clientsResult, agentsResult] = await Promise.all([
    supabase
      .from("properties")
      .select("id, title, address, cities!city_id(name)")
      .eq("status", "ACTIVO")
      .order("title", { ascending: true }),
    supabase
      .from("clients")
      .select("id, name, email, phone")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("users")
      .select("id, name, email")
      .in("role", ["ADMIN", "SUPERVISOR", "VENDEDOR"])
      .eq("is_active", true)
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
        <h1 className="text-3xl font-bold">Nueva Cita</h1>
        <p className="text-muted-foreground">Agenda una visita a una propiedad</p>
      </div>

      <AppointmentForm properties={properties} clients={clients} agents={agents} />
    </div>
  )
}
