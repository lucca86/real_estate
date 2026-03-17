import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, MapPin, Bed, Bath, Car, Maximize, Calendar, ChevronLeft, Edit, Ruler } from "lucide-react"
import Link from "next/link"
import { ImageGallery } from "@/components/image-gallery"
import { PropertiesMap } from "@/components/properties-map"
import { getPropertyById } from "@/lib/actions/properties"
import { PropertyContactCard } from "@/components/property-contact-card"

import { getPropertyFeatureAssignments } from "@/lib/actions/property-features"

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const property = await getPropertyById(id)

  if (!property) {
    notFound()
  }

  const featureAssignments = await getPropertyFeatureAssignments(id)
  const caracteristicas = featureAssignments
    .filter((a: any) => a.property_features?.type === "CARACTERISTICA")
    .map((a: any) => a.property_features?.name)
    .filter(Boolean)

  const amenidades = featureAssignments
    .filter((a: any) => a.property_features?.type === "AMENIDAD")
    .map((a: any) => a.property_features?.name)
    .filter(Boolean)

  const statusColors = {
    ACTIVO: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    DISPONIBLE: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    RESERVADO: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    VENDIDO: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    ALQUILADO: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  }

  const statusLabels = {
    ACTIVO: "Activo",
    DISPONIBLE: "Disponible",
    RESERVADO: "Reservado",
    VENDIDO: "Vendido",
    ALQUILADO: "Alquilado",
  }

  const propertyImages = property.images || []

  const currencyLabels = {
    USD: "Dólares",
    ARS: "Pesos",
    EUR: "Euros",
  }

  const allCharacteristics = []

  if (property.property_type) {
    allCharacteristics.push({ icon: Building2, label: "Tipo", value: property.property_type.name })
  }
  if (property.bedrooms) {
    allCharacteristics.push({ icon: Bed, label: "Habitaciones", value: property.bedrooms })
  }
  if (property.bathrooms) {
    allCharacteristics.push({ icon: Bath, label: "Baños", value: property.bathrooms })
  }
  if (property.parking_spaces) {
    allCharacteristics.push({ icon: Car, label: "Estacionamientos", value: property.parking_spaces })
  }
  if (property.coveredarea) {
    allCharacteristics.push({ icon: Maximize, label: "Área cubierta", value: `${property.coveredarea}m²` })
  }
  if (property.area) {
    allCharacteristics.push({ icon: Maximize, label: "Área total", value: `${property.area}m²` })
  }
  if (property.lot_size || property.lotSize) {
    const lotSize = property.lot_size || property.lotSize
    allCharacteristics.push({ icon: Ruler, label: "Tamaño del Lote", value: `${lotSize}m²` })
  }
  if (property.frontSize) {
    allCharacteristics.push({ icon: Ruler, label: "Frente", value: `${property.frontSize}m` })
  }
  if (property.depthSize) {
    allCharacteristics.push({ icon: Ruler, label: "Fondo", value: `${property.depthSize}m` })
  }
  if (property.year_built && property.year_built > 0) {
    allCharacteristics.push({ icon: Calendar, label: "Año de Construcción", value: property.year_built })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/properties">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver a propiedades
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/properties/${property.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
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
                  {statusLabels[property.status as keyof typeof statusLabels] || property.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Descripción</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{property.description}</p>
              </div>

              {property.internal_notes && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20">
                    <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">Notas Internas</h3>
                    <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">{property.internal_notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="mb-3 font-semibold">Características</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allCharacteristics.map((char, index) => {
                    const Icon = char.icon
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{char.label}:</span>
                        <span className="font-medium">{char.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {caracteristicas.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-3 font-semibold">Características Adicionales</h3>
                    <div className="flex flex-wrap gap-2">
                      {caracteristicas.map((feature: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {amenidades.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-3 font-semibold">Amenidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {amenidades.map((amenity: string, index: number) => (
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
                      <PropertiesMap
                        properties={[
                          {
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
                          },
                        ]}
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
                  <span className="text-muted-foreground">
                    {currencyLabels[property.currency as keyof typeof currencyLabels] || property.currency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {property.owner && <PropertyContactCard owner={property.owner} />}

          {/* Auditoría */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Auditoría</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Creado por</p>
                <p className="font-semibold">
                  {property.createdBy?.name || property.createdBy?.email || "Sin información"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(property.created_at).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actualizado por</p>
                <p className="font-semibold">
                  {property.updatedBy?.name || property.updatedBy?.email || "Sin información"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(property.updated_at).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notas Internas */}
          {property.internal_notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notas Internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{property.internal_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
