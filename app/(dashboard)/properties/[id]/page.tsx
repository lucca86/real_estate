import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from 'next/navigation'
import { getPropertyById } from "@/lib/actions/properties"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { WordPressSyncButton } from "@/components/wordpress-sync-button"
import { ImageGallery } from "@/components/image-gallery"
import { PropertiesMap } from "@/components/properties-map"
import { MapPin, Bed, Bath, Car, User, ChevronLeft, Edit } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

const statusColors = {
  DISPONIBLE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  RESERVADO: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  VENDIDO: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  ALQUILADO: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
}

const statusLabels = {
  DISPONIBLE: "Disponible",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
  ALQUILADO: "Alquilado",
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const property = await getPropertyById(params.id)

  if (!property) {
    notFound()
  }

  const propertyImages = property.images || []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/properties" className="flex items-center gap-2 text-sm font-medium hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Volver a propiedades
        </Link>
        <div className="flex items-center gap-4">
          <WordPressSyncButton
            propertyId={property.id}
            wordpressId={property.wordpress_id}
            syncedAt={property.synced_at}
          />
          <Button asChild variant="outline">
            <Link href={`/properties/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{property.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span>{`${property.address}${property.city ? `, ${property.city.name}` : ""}`}</span>
          </div>

          {property.description && <p className="text-muted-foreground">{property.description}</p>}

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-muted-foreground" />
              <span>{property.bedrooms || 0} habitaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5 text-muted-foreground" />
              <span>{property.bathrooms || 0} baños</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-muted-foreground" />
              <span>{property.parking_spaces || 0} parqueos</span>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            {property.status === "DISPONIBLE" && (
              <div className="flex items-center gap-2">
                <span>Disponible ahora</span>
              </div>
            )}
            {property.owner && (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span>Propietario: {property.owner.name}</span>
              </div>
            )}
          </div>

          <Separator />

          {propertyImages.length > 0 && <ImageGallery images={propertyImages} title={property.title} />}

          {property.latitude && property.longitude && (
            <PropertiesMap
              properties={[
                {
                  id: property.id,
                  title: property.title,
                  status: property.status,
                  address: property.address,
                  latitude: property.latitude,
                  longitude: property.longitude,
                  price: property.price,
                  currency: property.currency,
                  images: propertyImages,
                  propertyType: property.property_type?.name || "Sin tipo",
                  city: property.city?.name || property.address,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
