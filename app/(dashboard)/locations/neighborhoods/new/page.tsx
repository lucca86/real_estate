import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NeighborhoodForm } from "@/components/neighborhood-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getAllCities, getAllProvinces } from "@/lib/actions/locations"

export default async function NewNeighborhoodPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [citiesResult, provincesResult] = await Promise.all([getAllCities(), getAllProvinces()])

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
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Barrio</h1>
        <p className="text-muted-foreground">Agrega un nuevo barrio al sistema</p>
      </div>

      <NeighborhoodForm cities={cities} provinces={provinces} />
    </div>
  )
}
