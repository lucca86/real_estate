import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getClients, getAgents } from "@/lib/actions/clients"
import { getCurrentUser, checkPermission } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClientsTable } from "@/components/clients-table"
import { Suspense } from "react"

export default async function ClientsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const canManage = await checkPermission("clients.manage")

  const [clientsResult, agentsResult] = await Promise.all([
    getClients(),
    user.role === "ADMIN" ? getAgents() : Promise.resolve({ success: true, data: [] }),
  ])

  if (!clientsResult.success || !clientsResult.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Error al cargar clientes</p>
      </div>
    )
  }

  const clients = clientsResult.data
  const agents = agentsResult.success ? agentsResult.data : []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu base de clientes potenciales</p>
        </div>
        {canManage && (
          <Link href="/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        )}
      </div>

      <Suspense fallback={<div>Cargando clientes...</div>}>
        <ClientsTable clients={clients} userRole={user.role} agents={agents} />
      </Suspense>
    </div>
  )
}
