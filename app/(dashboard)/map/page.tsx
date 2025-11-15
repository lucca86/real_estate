import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { PropertiesMap } from "@/components/properties-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function MapPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createServerClient()
  const { data: propertiesData, error } = await supabase
    .from('properties')
    .select(`
      id,
      title,
      address,
      city_id,
      cities!properties_city_id_fkey(name),
      latitude,
      longitude,
      price,
      currency,
      property_type_id,
      property_types!properties_property_type_id_fkey(name),
      status,
      images
    `)
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false })

  const properties = propertiesData?.map((prop: any) => ({
    id: prop.id,
    title: prop.title,
    address: prop.address,
    city: prop.cities?.name || "",
    latitude: prop.latitude,
    longitude: prop.longitude,
    price: prop.price,
    currency: prop.currency,
    propertyType: prop.property_types?.name || "",
    status: prop.status,
    images: prop.images
  })) || []

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
