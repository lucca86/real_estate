import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Globe, MapPin, Building2, Home } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { LocationTable } from "@/components/location-table"

export default async function LocationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [countries, provinces, cities, neighborhoods] = await Promise.all([
    prisma.country.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { provinces: true, properties: true },
        },
      },
    }),
    prisma.province.findMany({
      orderBy: { name: "asc" },
      include: {
        country: { select: { name: true } },
        _count: {
          select: { cities: true, properties: true },
        },
      },
    }),
    prisma.city.findMany({
      orderBy: { name: "asc" },
      include: {
        province: { select: { name: true } },
        _count: {
          select: { neighborhoods: true, properties: true },
        },
      },
    }),
    prisma.neighborhood.findMany({
      orderBy: { name: "asc" },
      include: {
        city: { select: { name: true } },
        _count: {
          select: { properties: true },
        },
      },
    }),
  ])

  const filterOptions = {
    countries: countries.map((c) => ({ id: c.id, name: c.name })),
    provinces: provinces.map((p) => ({ id: p.id, name: p.name })),
    cities: cities.map((c) => ({ id: c.id, name: c.name })),
  }

  return (
    <DashboardLayout user={user}>
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
                    { key: "_count.provinces", label: "Provincias" },
                    { key: "_count.properties", label: "Propiedades" },
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
                    { key: "_count.cities", label: "Ciudades" },
                    { key: "_count.properties", label: "Propiedades" },
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
                    { key: "_count.neighborhoods", label: "Barrios" },
                    { key: "_count.properties", label: "Propiedades" },
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
                    { key: "_count.properties", label: "Propiedades" },
                  ]}
                  filterOptions={filterOptions}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
