import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Globe, MapPin, Building2, Home } from 'lucide-react'
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { LocationTable } from "@/components/location-table"

export default async function LocationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const supabase = await createServerClient()

  const [countriesResult, provincesResult, citiesResult, neighborhoodsResult] = await Promise.all([
    supabase.from('countries').select('*').order('name', { ascending: true }),
    supabase.from('provinces').select('*, country:countries!provinces_country_id_fkey(name)').order('name', { ascending: true }),
    supabase.from('cities').select('*, province:provinces!cities_province_id_fkey(name)').order('name', { ascending: true }),
    supabase.from('neighborhoods').select('*, city:cities!neighborhoods_city_id_fkey(name)').order('name', { ascending: true }),
  ])

  const countries = countriesResult.data || []
  const provinces = provincesResult.data || []
  const cities = citiesResult.data || []
  const neighborhoods = neighborhoodsResult.data || []

  const filterOptions = {
    countries: countries.map((c) => ({ id: c.id, name: c.name })),
    provinces: provinces.map((p) => ({ id: p.id, name: p.name })),
    cities: cities.map((c) => ({ id: c.id, name: c.name })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Ubicaciones</h1>
        <p className="text-muted-foreground">Administra países, provincias, ciudades y barrios</p>
      </div>

      <Tabs defaultValue="countries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="countries" className="gap-2">
            <Globe className="h-4 w-4" />
            Países
          </TabsTrigger>
          <TabsTrigger value="provinces" className="gap-2">
            <MapPin className="h-4 w-4" />
            Provincias
          </TabsTrigger>
          <TabsTrigger value="cities" className="gap-2">
            <Building2 className="h-4 w-4" />
            Ciudades
          </TabsTrigger>
          <TabsTrigger value="neighborhoods" className="gap-2">
            <Home className="h-4 w-4" />
            Barrios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Países</CardTitle>
                  <CardDescription>Gestiona los países disponibles en el sistema</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/locations/countries/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo País
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LocationTable
                data={countries}
                type="country"
                columns={[
                  { key: "name", label: "Nombre" },
                  { key: "code", label: "Código" },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provinces" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Provincias</CardTitle>
                  <CardDescription>Gestiona las provincias disponibles en el sistema</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/locations/provinces/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Provincia
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LocationTable
                data={provinces}
                type="province"
                columns={[
                  { key: "name", label: "Nombre" },
                  { key: "country.name", label: "País" },
                ]}
                filterOptions={filterOptions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ciudades</CardTitle>
                  <CardDescription>Gestiona las ciudades disponibles en el sistema</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/locations/cities/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Ciudad
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LocationTable
                data={cities}
                type="city"
                columns={[
                  { key: "name", label: "Nombre" },
                  { key: "province.name", label: "Provincia" },
                ]}
                filterOptions={filterOptions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neighborhoods" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Barrios</CardTitle>
                  <CardDescription>Gestiona los barrios disponibles en el sistema</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/locations/neighborhoods/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Barrio
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LocationTable
                data={neighborhoods}
                type="neighborhood"
                columns={[
                  { key: "name", label: "Nombre" },
                  { key: "city.name", label: "Ciudad" },
                ]}
                filterOptions={filterOptions}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
