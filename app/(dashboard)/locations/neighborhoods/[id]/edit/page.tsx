import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { NeighborhoodForm } from "@/components/neighborhood-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getNeighborhoodById, getAllCities, getAllProvinces } from "@/lib/actions/locations"

export default async function EditNeighborhoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [neighborhood, citiesResult, provincesResult] = await Promise.all([
    getNeighborhoodById(id),
    getAllCities(),
    getAllProvinces(),
  ])

  if (!neighborhood) {
    notFound()
  }

  const citiesData = Array.isArray(citiesResult) ? citiesResult : []
  const provincesData = provincesResult.success && provincesResult.data ? provincesResult.data : []

  const cities = citiesData
    .filter((c: any) => c.province && c.province.country)
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      province: {
        id: c.province.id,
        name: c.province.name,
        country: {
          id: c.province.country.id,
          name: c.province.country.name,
        },
      },
    }))

  const provinces = provincesData
    .filter((p: any) => p.country)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      country: {
        id: p.country.id,
        name: p.country.name,
      },
    }))

  return (
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
          isActive: neighborhood.is_active,
        }}
        cities={cities}
        provinces={provinces}
      />
    </div>
  )
}
