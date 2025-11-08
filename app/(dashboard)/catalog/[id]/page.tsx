import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Car,
  Maximize,
  Calendar,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { ImageGallery } from "@/components/image-gallery"
import { PropertyMap } from "@/components/property-map"

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  if (!property) {
    notFound()
  }

  // Increment views
  await prisma.property.update({
    where: { id },
    data: { views: { increment: 1 } },
  })

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

  const typeLabels = {
    CASA: "Casa",
    APARTAMENTO: "Apartamento",
    TERRENO: "Terreno",
    LOCAL_COMERCIAL: "Local Comercial",
    OFICINA: "Oficina",
    BODEGA: "Bodega",
  }

  const transactionLabels = {
    VENTA: "Venta",
    ALQUILER: "Alquiler",
    VENTA_ALQUILER: "Venta/Alquiler",
  }

  return (
    <DashboardLayout user={user}>
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
                <ImageGallery images={property.images} title={property.title} />
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
                      {property.address}, {property.city}, {property.state}
                    </div>
                  </div>
                  <Badge variant="secondary" className={statusColors[property.status]}>
                    {statusLabels[property.status]}
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
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{typeLabels[property.propertyType]}</span>
                    </div>
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
                    {property.parkingSpaces && (
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Estacionamientos:</span>
                        <span className="font-medium">{property.parkingSpaces}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Maximize className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Área:</span>
                      <span className="font-medium">{property.area}m²</span>
                    </div>
                    {property.lotSize && (
                      <div className="flex items-center gap-2 text-sm">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Lote:</span>
                        <span className="font-medium">{property.lotSize}m²</span>
                      </div>
                    )}
                    {property.yearBuilt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Año:</span>
                        <span className="font-medium">{property.yearBuilt}</span>
                      </div>
                    )}
                  </div>
                </div>

                {property.features.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-3 font-semibold">Características Adicionales</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {property.amenities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-3 font-semibold">Amenidades</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {property.virtualTour && (
                  <>
                    <Separator />
                    <div>
                      <Button asChild variant="outline" className="w-full bg-transparent">
                        <a href={property.virtualTour} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Ver Tour Virtual
                        </a>
                      </Button>
                    </div>
                  </>
                )}

                {/* Location section with map */}
                {property.latitude && property.longitude && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ubicación</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{property.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.city}, {property.state}, {property.country}
                            </p>
                            {property.zipCode && (
                              <p className="text-sm text-muted-foreground">CP: {property.zipCode}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <PropertyMap
                        latitude={property.latitude}
                        longitude={property.longitude}
                        title={property.title}
                        address={`${property.address}, ${property.city}`}
                      />
                    </CardContent>
                  </Card>
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
                  {property.pricePerM2 && (
                    <p className="mt-1 text-sm text-muted-foreground">${property.pricePerM2.toFixed(0)} por m²</p>
                  )}
                </div>
                <Badge variant="outline">{transactionLabels[property.transactionType]}</Badge>
                {property.rentalPrice && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-sm text-muted-foreground">Precio de alquiler</p>
                    <p className="text-lg font-semibold">
                      ${property.rentalPrice.toLocaleString()} {property.currency}/mes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{property.createdBy.name}</span>
                </div>
                {property.createdBy.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${property.createdBy.email}`} className="text-primary hover:underline">
                      {property.createdBy.email}
                    </a>
                  </div>
                )}
                {property.createdBy.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${property.createdBy.phone}`} className="text-primary hover:underline">
                      {property.createdBy.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vistas</span>
                  <span className="font-medium">{property.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publicada</span>
                  <span className="font-medium">{new Date(property.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actualizada</span>
                  <span className="font-medium">{new Date(property.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
