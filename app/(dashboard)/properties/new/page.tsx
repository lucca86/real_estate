import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PropertyForm } from "@/components/property-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function NewPropertyPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/properties">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Nueva Propiedad</h1>
          <p className="text-muted-foreground">Agrega una nueva propiedad al inventario</p>
        </div>

        <PropertyForm />
      </div>
    </DashboardLayout>
  )
}
