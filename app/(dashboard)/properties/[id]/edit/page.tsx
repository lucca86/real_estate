import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from 'next/navigation'
import { PropertyForm } from "@/components/property-form"
import { WordPressSyncButton } from "@/components/wordpress-sync-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getPropertyById } from "@/lib/actions/properties"
import type { TransactionType } from "@prisma/client"

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
    ownerId: propertyData.owner_id,
    owner: propertyData.owner ? { id: propertyData.owner.id, name: propertyData.owner.name } : undefined,
    propertyTypeId: propertyData.property_type_id,
    status: propertyData.status,
    address: propertyData.address,
    city: propertyData.city?.name || "",
    country: propertyData.country?.name || "",
    state: propertyData.province?.name || "",
    countryId: propertyData.country_id,
    provinceId: propertyData.province_id,
    cityId: propertyData.city_id,
    neighborhoodId: propertyData.neighborhood_id,
    latitude: propertyData.latitude,
    longitude: propertyData.longitude,
    bedrooms: propertyData.bedrooms,
    bathrooms: propertyData.bathrooms,
    parkingSpaces: propertyData.parking_spaces,
    area: propertyData.area,
    yearBuilt: propertyData.year_built,
    price: propertyData.price,
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
    lotSize: propertyData.lot_size || null,
    pricePerM2: propertyData.price_per_m2 || null,
    rentalPrice: propertyData.rental_price || null,
    virtualTour: propertyData.virtual_tour || null,
    propertyLabel: (propertyData.property_label as any) || null,
    published: propertyData.published !== false,
    features: propertyData.features || [],
    videos: propertyData.videos || [],
    createdAt: new Date(propertyData.created_at),
    updatedAt: new Date(propertyData.updated_at),
  }

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
          />
        </CardContent>
      </Card>

      <PropertyForm editProperty={property} />
    </div>
  )
}
