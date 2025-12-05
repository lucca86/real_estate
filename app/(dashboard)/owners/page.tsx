import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getOwners } from "@/lib/actions/owners"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { OwnersTable } from "@/components/owners-table"

export default async function OwnersPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getOwners()

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Error al cargar propietarios</p>
      </div>
    )
  }

  const owners = result.data

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Propietarios</h1>
          <p className="text-muted-foreground mt-1">Gestiona los propietarios de las propiedades</p>
        </div>
        <Link href="/owners/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Propietario
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Cargando propietarios...</div>}>
        <OwnersTable owners={owners} />
      </Suspense>
    </div>
  )
}
