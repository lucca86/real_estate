import { getCurrentUser, checkPermission } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { PropertyForm } from "@/components/property-form"
import { WordPressSyncButton } from "@/components/wordpress-sync-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getPropertyById } from "@/lib/actions/properties"
import { getPropertyEditMode } from "@/lib/actions/system-settings"

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

  // Apply property_edit_mode setting: in "restricted" mode, VENDEDOR can only edit their own properties
  // ADMIN and SUPERVISOR can always edit any property
  if (user.role === "VENDEDOR") {
    const editMode = await getPropertyEditMode()
    if (editMode === "restricted" && propertyData.created_by_id && propertyData.created_by_id !== user.id) {
      redirect("/properties")
    }
  }

  const canDeleteImages = await checkPermission("images.delete")

  const property = {
    id: propertyData.id,
    title: propertyData.title,
    description: propertyData.description,
    status: propertyData.status,
    address: propertyData.address,
    latitude: propertyData.latitude,
    longitude: propertyData.longitude,
    bedrooms: propertyData.bedrooms,
    bathrooms: propertyData.bathrooms,
    parkingSpaces: propertyData.parking_spaces,
    area: propertyData.area,
    lotSize: propertyData.lot_size,
    frontSize: propertyData.frontSize,
    depthSize: propertyData.depthSize,
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

  // images are stored as text[] where each element is a JSON string — must parse before accessing fields
  const parsedImages = (propertyData.images || []).map((img: any) => {
    if (typeof img === "string") {
      try { return JSON.parse(img) } catch { return {} }
    }
    return img
  })
  const hasImagesToSync = parsedImages.some((img: any) => img.syncToWordPress === true)

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

                <PropertyForm editProperty={property} canDeleteImages={canDeleteImages} />
    </div>
  )
}
