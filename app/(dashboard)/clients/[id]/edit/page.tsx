import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { ClientForm } from "@/components/client-form"
import { getClientById, getAgents } from "@/lib/actions/clients"

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  const [clientResult, agentsResult] = await Promise.all([
    getClientById(id),
    user.role === "ADMIN" ? getAgents() : Promise.resolve({ success: true, data: [] }),
  ])

  if (!clientResult.success || !clientResult.data) {
    notFound()
  }

  const client = clientResult.data
  const agents = agentsResult.success ? agentsResult.data : []

  const transformedClient = {
    ...client,
    city: client.city?.name || null,
    state: client.province?.name || null,
    country: client.country?.name || "",
    preferredPropertyType: client.preferredPropertyTypeId ? (client.preferredPropertyType?.name as any) : null,
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
        <p className="text-muted-foreground">Actualiza la información del cliente</p>
      </div>

      <ClientForm client={transformedClient} userRole={user.role} agents={agents} />
    </div>
  )
}
