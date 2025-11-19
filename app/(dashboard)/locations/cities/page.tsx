import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { getAllCities } from "@/lib/actions/locations"
import { Button } from "@/components/ui/button"
import { Plus, MapPin } from 'lucide-react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CitiesTableWithFilters } from "@/components/cities-table-with-filters"

export default async function CitiesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getAllCities()

  if (!result.success || !result.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Error al cargar ciudades</p>
      </div>
    )
  }

  const cities = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ciudades</h1>
          <p className="text-muted-foreground">Gestiona las ciudades del sistema</p>
        </div>
        <Button asChild>
          <Link href="/locations/cities/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Ciudad
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lista de Ciudades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No hay ciudades registradas</p>
              <Button asChild className="mt-4">
                <Link href="/locations/cities/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera ciudad
                </Link>
              </Button>
            </div>
          ) : (
            <CitiesTableWithFilters cities={cities} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
