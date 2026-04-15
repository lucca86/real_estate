import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { PropertiesMap } from "@/components/properties-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function MapPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createAdminClient()
  const { data: propertiesData, error } = await supabase
    .from("Property")
    .select(`
      id, title, address, cityId, latitude, longitude,
      price, currency, status, images,
      city:City!cityId(name),
      propertyType:PropertyType!propertyTypeId(name)
    `)
    .eq("isActive", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("createdAt", { ascending: false })

  const properties =
    propertiesData?.map((prop: any) => ({
      id: prop.id,
      title: prop.title,
      address: prop.address,
      city: prop.city?.name || "",
      latitude: prop.latitude,
      longitude: prop.longitude,
      price: prop.price,
      currency: prop.currency,
      propertyType: prop.propertyType?.name || "",
      status: prop.status,
      images: prop.images,
    })) || []

  return (
    <div className="space-y-6 relative z-0">
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
