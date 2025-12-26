"use client"

import type React from "react"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Edit, MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { DeletePropertyButton } from "@/components/delete-property-button"
import type { SessionUser } from "@/lib/auth"
import { normalizeImageUrl } from "@/lib/image-utils"
import { PropertyImage as PropertyImageComponent } from "@/components/property-image"

interface Property {
  id: string
  title: string
  images: any[]
  status: string
  transaction_type: string
  price: number
  currency: string
  bedrooms: number | null
  bathrooms: number | null
  ownerId: string
  city: { name: string } | null
  province: { name: string } | null
  propertyType: { name: string } | null
  owner: { name: string } | null
  wordpress_id: number | null
  wordpress_synced_at: string | null
}

interface PropertiesTableProps {
  properties: Property[]
  currentUser: SessionUser
}

const statusColors: Record<string, string> = {
  ACTIVO: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  RESERVADO: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  VENDIDO: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  ALQUILADO: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  ELIMINADO: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  EN_REVISION: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
}

const statusLabels: Record<string, string> = {
  ACTIVO: "Activo",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
  ALQUILADO: "Alquilado",
  ELIMINADO: "Eliminado",
  EN_REVISION: "En Revisión",
}

const transactionLabels: Record<string, string> = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  VENTA_ALQUILER: "Venta/Alquiler",
  ALQUILER_OPCION_COMPRA: "Alquiler con Opción a Compra",
}

const transactionColors: Record<string, string> = {
  VENTA: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ALQUILER: "bg-green-500/10 text-green-500 border-green-500/20",
  VENTA_ALQUILER: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ALQUILER_OPCION_COMPRA: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

const currencyLabels: Record<string, string> = {
  USD: "Dólares",
  ARS: "Pesos",
}

function PropertyCard({ property, currentUser }: { property: Property; currentUser: SessionUser }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const propertyImages = Array.isArray(property.images) ? property.images : []
  const currentImageUrl = propertyImages.length > 0 ? normalizeImageUrl(propertyImages[currentImageIndex]) : ""

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? propertyImages.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === propertyImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <div
      key={property.id}
      className="group relative overflow-hidden rounded-lg border border-border transition-all hover:shadow-lg"
    >
      <Link href={`/properties/${property.id}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {propertyImages.length > 0 ? (
            <>
              <PropertyImageComponent
                src={currentImageUrl || "/placeholder.svg"}
                alt={property.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />

              {propertyImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={goToNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                    {currentImageIndex + 1} / {propertyImages.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link href={`/properties/${property.id}`} className="flex-1">
            <h3 className="font-semibold leading-tight text-balance hover:text-primary">{property.title}</h3>
          </Link>
          <Badge variant="secondary" className={statusColors[property.status] || ""}>
            {statusLabels[property.status] || property.status}
          </Badge>
        </div>

        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {property.city?.name || "Sin ciudad"}, {property.province?.name || "Sin provincia"}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant="outline">{property.propertyType?.name || "Sin tipo"}</Badge>
          {property.transaction_type && (
            <Badge
              variant="outline"
              className={transactionColors[property.transaction_type as keyof typeof transactionColors] || ""}
            >
              {transactionLabels[property.transaction_type as keyof typeof transactionLabels] ||
                property.transaction_type}
            </Badge>
          )}
        </div>

        {property.bedrooms && property.bathrooms && (
          <div className="mb-3 text-sm text-muted-foreground">
            {property.bedrooms} hab • {property.bathrooms} baños
          </div>
        )}

        <div className="mb-4 flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">${property.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">
            {currencyLabels[property.currency] || property.currency}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {property.owner?.name && <span>Propietario: {property.owner.name}</span>}
            {property.wordpress_synced_at && property.wordpress_id && property.wordpress_id > 0 ? (
              <span className="text-green-600">
                Sincronizada:{" "}
                {new Date(property.wordpress_synced_at).toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : property.wordpress_synced_at && (!property.wordpress_id || property.wordpress_id === 0) ? (
              <span className="text-orange-600 font-medium">Sincronización: Pendiente (falló)</span>
            ) : null}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/properties/${property.id}/edit`}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Link>
            </Button>
            {(currentUser.role === "ADMIN" || property.ownerId === currentUser.id) && (
              <DeletePropertyButton propertyId={property.id} propertyTitle={property.title} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PropertiesTable({ properties, currentUser }: PropertiesTableProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay propiedades</h3>
            <p className="mt-2 text-sm text-muted-foreground">Comienza agregando tu primera propiedad</p>
            <Button asChild className="mt-4">
              <Link href="/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Propiedad
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} currentUser={currentUser} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
