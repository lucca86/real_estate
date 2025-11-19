import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { NeighborhoodForm } from "@/components/neighborhood-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from 'lucide-react'
import Link from "next/link"
import { getAllCities } from "@/lib/actions/locations"

export default async function NewNeighborhoodPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const citiesResult = await getAllCities()
  const cities = citiesResult.success && citiesResult.data
    ? citiesResult.data.map((c: any) => ({
        id: c.id,
        name: c.name,
        province: {
          name: c.province?.name || ''
        }
      }))
    : []

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/locations">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver a Ubicaciones
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Barrio</h1>
          <p className="text-muted-foreground">Agrega un nuevo barrio al sistema</p>
        </div>

        <NeighborhoodForm cities={cities} />
      </div>
    </DashboardLayout>
  )
}
