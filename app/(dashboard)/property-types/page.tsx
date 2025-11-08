import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PropertyTypesTable } from "@/components/property-types-tables"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PropertyTypesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  // Only admins and supervisors can manage property types
  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout user={user}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tipos de Propiedad</h1>
            <p className="text-muted-foreground">Gestiona los tipos de propiedad disponibles</p>
          </div>
          <Button asChild>
            <Link href="/property-types/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tipo
            </Link>
          </Button>
        </div>

        <Suspense fallback={<div>Cargando...</div>}>
          <PropertyTypesTable />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
