import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, MapPin, Bed, Bath, Car, Maximize, Calendar, User, Phone, Mail, ChevronLeft, ExternalLink } from 'lucide-react'
import Link from "next/link"
import { ImageGallery } from "@/components/image-gallery"
import { PropertyMap } from "@/components/property-map"
import { getPropertyById } from "@/lib/actions/properties"

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const property = await getPropertyById(id)

  if (!property) {
    notFound()
  }

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

  const propertyImages = property.images || []

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/catalog">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Images */}
          <Card>
            <CardContent className="p-4">
              <ImageGallery images={propertyImages} title={property.title} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-balance">{property.title}</CardTitle>
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {property.address}
                    {property.city && `, ${property.city.name}`}
                    {property.province && `, ${property.province.name}`}
                  </div>
                </div>
                <Badge variant="secondary" className={statusColors[property.status as keyof typeof statusColors]}>
                  {statusLabels[property.status as keyof typeof statusLabels]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Descripción</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{property.description}</p>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 font-semibold">Características</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {property.property_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{property.property_type.name}</span>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Habitaciones:</span>
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-2 text-sm">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Baños:</span>
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                  )}
                  {property.parking_spaces && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Estacionamientos:</span>
                      <span className="font-medium">{property.parking_spaces}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Área:</span>
                    <span className="font-medium">{property.area}m²</span>
                  </div>
                  {property.year_built && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Año:</span>
                      <span className="font-medium">{property.year_built}</span>
                    </div>
                  )}
                </div>
              </div>

              {property.amenities && property.amenities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-3 font-semibold">Amenidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Location section with map */}
              {property.latitude && property.longitude && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-3 font-semibold">Ubicación</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{property.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.city?.name}
                              {property.province && `, ${property.province.name}`}
                              {property.country && `, ${property.country.name}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <PropertyMap
                        properties={[{
                          id: property.id,
                          title: property.title,
                          address: property.address,
                          latitude: property.latitude,
                          longitude: property.longitude,
                          price: property.price,
                          currency: property.currency,
                          propertyType: property.property_type?.name || "Sin tipo",
                          city: property.city?.name || "Sin ciudad",
                          images: property.images || [],
                          status: property.status,
                        }]}
                        defaultCenter={[property.latitude, property.longitude]}
                        defaultZoom={15}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Price */}
          <Card>
            <CardHeader>
              <CardTitle>Precio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">${property.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">{property.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          {property.owner && (
            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{property.owner.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{property.owner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{property.owner.email}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Publicada</span>
                <span className="font-medium">{new Date(property.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Actualizada</span>
                <span className="font-medium">{new Date(property.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
