import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getClients } from "@/lib/actions/clients"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClientsTable } from "@/components/clients-table"
import { Suspense } from "react"

export default async function ClientsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getClients()

  if (!result.success || !result.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Error al cargar clientes</p>
      </div>
    )
  }

  const clients = result.data

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu base de clientes potenciales</p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando clientes...</div>}>
        <ClientsTable clients={clients} />
      </Suspense>
    </div>
  )
}
