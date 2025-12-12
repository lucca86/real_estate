import { getAllServices } from "@/lib/actions/services"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ServicesTable } from "@/components/services-table"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ServicesPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const services = await getAllServices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servicios</h1>
          <p className="text-muted-foreground">Gestiona los servicios disponibles para la agenda de contactos</p>
        </div>
        <Link href="/services/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </Link>
      </div>

      <ServicesTable services={services} />
    </div>
  )
}
