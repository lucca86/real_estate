import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CityForm } from "@/components/city-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getAllProvinces, getAllCountries } from "@/lib/actions/locations"

export default async function NewCityPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [provincesResult, countriesResult] = await Promise.all([getAllProvinces(), getAllCountries()])

  const provinces =
    provincesResult.success && provincesResult.data
      ? provincesResult.data
          .filter((p: any) => p.country) // Filter out provinces without country
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            country: {
              id: p.country.id,
              name: p.country.name,
            },
          }))
      : []

  const countries =
    countriesResult.success && countriesResult.data
      ? countriesResult.data.map((c: any) => ({
          id: c.id,
          name: c.name,
        }))
      : []

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/locations">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a Ubicaciones
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Ciudad</h1>
        <p className="text-muted-foreground">Agrega una nueva ciudad al sistema</p>
      </div>

      <CityForm provinces={provinces} countries={countries} />
    </div>
  )
}
