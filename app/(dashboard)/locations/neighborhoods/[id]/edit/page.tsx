import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { NeighborhoodForm } from "@/components/neighborhood-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from 'lucide-react'
import Link from "next/link"
import { getNeighborhoodById, getAllCities } from "@/lib/actions/locations"

export default async function EditNeighborhoodPage({ params }: { params: { id: string } }) {
  const { id } = params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [neighborhood, citiesResult] = await Promise.all([
    getNeighborhoodById(id),
    getAllCities(),
  ])

  if (!neighborhood) {
    notFound()
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Editar Barrio</h1>
          <p className="text-muted-foreground">Modifica la información del barrio</p>
        </div>

        <NeighborhoodForm 
          neighborhood={{
            id: neighborhood.id,
            name: neighborhood.name,
            cityId: neighborhood.city_id,
            isActive: neighborhood.is_active
          }}
          cities={cities} 
        />
      </div>
    </DashboardLayout>
  )
}
