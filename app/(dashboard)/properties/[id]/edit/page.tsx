import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PropertyForm } from "@/components/property-form"
import { WordPressSyncButton } from "@/components/wordpress-sync-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getPropertyById } from "@/lib/actions/properties"

type TransactionType = "VENTA" | "ALQUILER" | "VENTA_ALQUILER" | "ALQUILER_OPCION_COMPRA"

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const propertyData = await getPropertyById(id)

  if (!propertyData) {
    notFound()
  }

  if (propertyData.created_by_id && propertyData.created_by_id !== user.id && user.role === "VENDEDOR") {
    redirect("/properties")
  }

  const property = {
    id: propertyData.id,
    title: propertyData.title,
    description: propertyData.description,
    status: propertyData.status,
    address: propertyData.address,
    // Location IDs — mapped from snake_case DB columns
    countryId: propertyData.country_id,
    provinceId: propertyData.province_id,
    cityId: propertyData.city_id,
    neighborhoodId: propertyData.neighborhood_id,
    // Owner and property type
    ownerId: propertyData.owner_id,
    propertyTypeId: propertyData.property_type_id,
    // Coordinates — numeric in DB, coerce to number to avoid string display issues
    latitude: propertyData.latitude != null ? Number(propertyData.latitude) : null,
    longitude: propertyData.longitude != null ? Number(propertyData.longitude) : null,
    bedrooms: propertyData.bedrooms != null ? Number(propertyData.bedrooms) : undefined,
    bathrooms: propertyData.bathrooms != null ? Number(propertyData.bathrooms) : undefined,
    parkingSpaces: propertyData.parking_spaces != null ? Number(propertyData.parking_spaces) : undefined,
    area: propertyData.area != null ? Number(propertyData.area) : undefined,
    lotSize: propertyData.lot_size != null ? Number(propertyData.lot_size) : undefined,
    // frontSize and depthSize are camelCase column names in the DB (quoted identifiers)
    frontSize: propertyData.frontSize != null ? Number(propertyData.frontSize) : undefined,
    depthSize: propertyData.depthSize != null ? Number(propertyData.depthSize) : undefined,
    yearBuilt: propertyData.year_built != null ? Number(propertyData.year_built) : null,
    price: propertyData.price != null ? Number(propertyData.price) : undefined,
    currency: propertyData.currency,
    amenities: propertyData.amenities || [],
    images: propertyData.images || [],
    isFeatured: propertyData.is_featured || false,
    featured: propertyData.is_featured || false,
    views: propertyData.views || 0,
    wordpressId: propertyData.wordpress_id,
    syncedAt: propertyData.synced_at,
    createdById: propertyData.created_by_id,
    syncToWordPress: propertyData.sync_to_wordpress || false,
    adrema: propertyData.adrema || null,
    transactionType: (propertyData.transaction_type || "VENTA") as TransactionType,
    rentalPeriod: (propertyData.rental_period as any) || null,
    zipCode: propertyData.zip_code || null,
    pricePerM2: propertyData.price_per_m2 || null,
    rentalPrice: propertyData.rental_price != null ? Number(propertyData.rental_price) : null,
    virtualTour: propertyData.virtual_tour || null,
    propertyLabel: (propertyData.property_label as any) || null,
    published: propertyData.published !== false,
    features: propertyData.features || [],
    videos: propertyData.videos || [],
    createdAt: new Date(propertyData.created_at),
    updatedAt: new Date(propertyData.updated_at),
  }

  const imagesToSync = (propertyData.images || []).filter((img: any) => img.syncToWordPress === true)
  const hasImagesToSync = imagesToSync.length > 0

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/properties">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Editar Propiedad</h1>
        <p className="text-muted-foreground">Actualiza la información de la propiedad</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publicar en WordPress</CardTitle>
        </CardHeader>
        <CardContent>
          <WordPressSyncButton
            propertyId={property.id}
            wordpressId={property.wordpressId}
            syncedAt={property.syncedAt}
            hasImagesToSync={hasImagesToSync}
          />
        </CardContent>
      </Card>

      <PropertyForm editProperty={property} />
    </div>
  )
}
