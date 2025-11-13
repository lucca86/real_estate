import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { PropertiesMap } from "@/components/properties-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function MapPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const propertiesData = await prisma.property.findMany({
    where: {
      published: true,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      title: true,
      address: true,
      city: { select: { name: true } },
      latitude: true,
      longitude: true,
      price: true,
      currency: true,
      propertyType: { select: { name: true } },
      status: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const properties = propertiesData.map((prop) => ({
    ...prop,
    city: prop.city?.name || "",
    propertyType: prop.propertyType?.name || "",
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mapa de Propiedades</h1>
        <p className="text-muted-foreground">Explora todas las propiedades disponibles en el mapa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Propiedades en el Mapa</CardTitle>
          <CardDescription>
            {properties.length} {properties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length > 0 ? (
            <PropertiesMap properties={properties} />
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">No hay propiedades con coordenadas disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
