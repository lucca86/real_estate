import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PropertiesTable } from "@/components/properties-table"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"

export default async function PropertiesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Propiedades</h1>
          <p className="text-muted-foreground">Gestiona el inventario de propiedades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/propietarios" target="_blank">
              <FileText className="mr-2 h-4 w-4" />
              Formulario Propietarios
            </Link>
          </Button>
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Propiedad
            </Link>
          </Button>
        </div>
      </div>

      <PropertiesTable currentUser={user} />
    </div>
  )
}
