import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClientForm } from "@/components/client-form"
import { getAgents } from "@/lib/actions/clients"

export default async function NewClientPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const agentsResult = user.role === "ADMIN" ? await getAgents() : { success: true, data: [] }
  const agents = agentsResult.success ? agentsResult.data : []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
        <p className="text-muted-foreground">Registra un nuevo cliente potencial</p>
      </div>

      <ClientForm userRole={user.role} agents={agents} />
    </div>
  )
}
