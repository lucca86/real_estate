"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PropertyImage as PropertyImageComponent } from "@/components/property-image"
import { Building2, MapPin, Bed, Bath, Car, Maximize, ChevronLeft, ChevronRight } from "lucide-react"
import { normalizeImageUrl } from "@/lib/image-utils"

interface Property {
  id: string
  title: string
  images: any[] | string[]
  city: { name: string } | null
  province: { name: string } | null
  status: string
  propertyType: { name: string } | null
  transaction_type: string
  bedrooms: number | null
  bathrooms: number | null
  parking_spaces: number | null
  area: number
  price: number
  currency: string
  price_per_m2: number | null
  property_label: string | null
}

interface CatalogPropertyCardProps {
  property: Property
}

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

const transactionLabels = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  VENTA_ALQUILER: "Venta/Alquiler",
  ALQUILER_OPCION_COMPRA: "Alquiler con Opción a Compra",
}

const transactionColors = {
  VENTA: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ALQUILER: "bg-green-500/10 text-green-500 border-green-500/20",
  VENTA_ALQUILER: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ALQUILER_OPCION_COMPRA: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

const labelColors = {
  NUEVA: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  DESTACADA: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  REBAJADA: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
}

const labelTexts = {
  NUEVA: "Nueva",
  DESTACADA: "Destacada",
  REBAJADA: "Rebajada",
}

const currencyLabels: Record<string, string> = {
  USD: "Dólares",
  DOP: "Pesos",
}

export function CatalogPropertyCard({ property }: CatalogPropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const currentImageUrl = normalizeImageUrl(property.images[currentImageIndex])

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1))
  }

  return (
    <Link
      href={`/catalog/${property.id}`}
      className="group relative overflow-hidden rounded-lg border border-border transition-all hover:shadow-lg"
    >
      {property.property_label && (
        <div className="absolute left-3 top-3 z-10">
          <Badge className={labelColors[property.property_label as keyof typeof labelColors]}>
            {labelTexts[property.property_label as keyof typeof labelTexts]}
          </Badge>
        </div>
      )}

      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {property.images.length > 0 ? (
          <>
            <PropertyImageComponent
              src={currentImageUrl || "/placeholder.svg"}
              alt={property.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />

            {property.images.length > 1 && (
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
                  {currentImageIndex + 1} / {property.images.length}
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

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-balance group-hover:text-primary">{property.title}</h3>
          <Badge variant="secondary" className={statusColors[property.status as keyof typeof statusColors]}>
            {statusLabels[property.status as keyof typeof statusLabels] || property.status}
          </Badge>
        </div>

        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {property.city?.name || "Sin ciudad"}, {property.province?.name || "Sin provincia"}
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <Badge variant="outline">{property.propertyType?.name || "Sin tipo"}</Badge>
          <Badge
            variant="outline"
            className={transactionColors[property.transaction_type as keyof typeof transactionColors]}
          >
            {transactionLabels[property.transaction_type as keyof typeof transactionLabels] ||
              property.transaction_type}
          </Badge>
        </div>

        {(property.bedrooms || property.bathrooms || property.parking_spaces || property.area) && (
          <div className="mb-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                {property.bedrooms}
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                {property.bathrooms}
              </div>
            )}
            {property.parking_spaces && (
              <div className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                {property.parking_spaces}
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                {property.area}m²
              </div>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1 border-t border-border pt-3">
          <span className="text-2xl font-bold text-primary">${property.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">
            {currencyLabels[property.currency] || property.currency}
          </span>
          {property.price_per_m2 && (
            <span className="ml-auto text-xs text-muted-foreground">${property.price_per_m2.toFixed(0)}/m²</span>
          )}
        </div>
      </div>
    </Link>
  )
}
