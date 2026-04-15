"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { wordpressAPI } from "@/lib/wordpress"
import { revalidatePath } from "next/cache"

function parseImage(img: any): any {
  if (typeof img === "string") {
    try {
      return JSON.parse(img)
    } catch {
      return img
    }
  }
  return img
}

export async function syncPropertyToWordPress(propertyId: string) {
  // This function is called from updateProperty which already verified authentication
  // We use adminClient to bypass RLS and avoid auth session issues in Server Actions
  const adminClient = await createAdminClient()

  const { data: property, error } = await adminClient
    .from("Property")
    .select(`
      *,
      property_type:PropertyType!propertyTypeId(name),
      city:City!cityId(name),
      province:Province!provinceId(name),
      country:Country!countryId(name),
      neighborhood:Neighborhood!neighborhoodId(name)
    `)
    .eq("id", propertyId)
    .single()

  if (error || !property) {
    throw new Error("Propiedad no encontrada")
  }

  const rawImages = property.images || []
  const allImages = rawImages.map(parseImage)
  const imagesToSync = allImages.filter((img: any) => img.syncToWordPress === true)

  if (imagesToSync.length === 0) {
    return {
      success: false,
      warning:
        "Debe seleccionar al menos una imagen para sincronizar con WordPress (imagen de portada). Marque las imágenes que desea sincronizar y vuelva a intentar.",
      wordpressId: null,
    }
  }

  try {
    const p = property as any
    const syncData = {
      id: property.id,
      wordpressId: p.wordpressId,
      wordpress_id: p.wordpressId,
      title: property.title,
      description: property.description,
      propertyType: p.property_type?.name,
      transactionType: p.transactionType,
      status: property.status,
      address: property.address,
      city: p.city?.name,
      state: p.province?.name,
      country: p.country?.name,
      zipCode: p.zipCode,
      latitude: property.latitude,
      longitude: property.longitude,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: p.parkingSpaces,
      area: property.area,
      lotSize: p.lotSize,
      yearBuilt: p.yearBuilt,
      price: property.price,
      currency: property.currency,
      pricePerM2: p.pricePerM2,
      features: property.features,
      amenities: property.amenities,
      images: imagesToSync,
      virtualTour: p.virtualTour,
      propertyLabel: p.propertyLabel,
      published: property.published,
    }

    const result = await wordpressAPI.syncProperty(syncData)

    const { error: updateError } = await adminClient
      .from("Property")
      .update({
        wordpressId: result.id,
        wordpressUrl: result.url,
        wordpressSyncedAt: new Date().toISOString(),
      })
      .eq("id", propertyId)

    // Non-fatal: log suppressed to avoid serialization errors

    revalidatePath("/properties")
    revalidatePath(`/properties/${propertyId}`)

    return { success: true, wordpressId: result.id }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Error al sincronizar con WordPress")
  }
}

export async function syncAllPropertiesToWordPress() {
  const { getCurrentUser } = await import("@/lib/auth")
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden sincronizar todas las propiedades")
  }

  const supabase = await createAdminClient()
  const { data: properties } = await supabase
    .from("Property")
    .select(`
      *,
      property_type:PropertyType!propertyTypeId(name),
      owner:Owner!ownerId(name),
      city:City!cityId(name),
      province:Province!provinceId(name),
      country:Country!countryId(name),
      neighborhood:Neighborhood!neighborhoodId(name)
    `)
    .eq("published", true)

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const property of properties || []) {
    try {
      const rawImages = property.images || []
      const parsedImages = rawImages.map(parseImage)

      if (parsedImages.length === 0) {
        throw new Error("La propiedad debe tener al menos una imagen para sincronizar con WordPress")
      }

      const imagesToSync = parsedImages.filter((img: any) => img.syncToWordPress === true)

      if (imagesToSync.length === 0) {
        throw new Error("La propiedad debe tener al menos una imagen marcada para WordPress")
      }

      const wordpressId = await wordpressAPI.syncProperty({
        id: property.id,
        wordpressId: property.wordpressId,
        title: property.title,
        description: property.description,
        propertyType: property.property_type?.name,
        transactionType: (property as any).transactionType,
        status: property.status,
        address: property.address,
        city: property.city?.name,
        state: property.province?.name,
        country: property.country?.name,
        zipCode: (property as any).zipCode,
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: (property as any).parkingSpaces,
        area: property.area,
        lotSize: (property as any).lotSize,
        yearBuilt: (property as any).yearBuilt,
        price: property.price,
        currency: property.currency,
        pricePerM2: (property as any).pricePerM2,
        features: property.features,
        amenities: property.amenities,
        images: imagesToSync,
        virtualTour: (property as any).virtualTour,
        propertyLabel: (property as any).propertyLabel,
        published: property.published,
      })

      await supabase
        .from("Property")
        .update({
          wordpressId: wordpressId,
          wordpressSyncedAt: new Date().toISOString(),
        })
        .eq("id", property.id)

      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${property.title}: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  revalidatePath("/properties")

  return results
}

export async function deletePropertyFromWordPress(propertyId: string) {
  const { getCurrentUser } = await import("@/lib/auth")
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  if (currentUser.role !== "ADMIN") {
    throw new Error("No tienes permisos para eliminar propiedades de WordPress")
  }

  const supabase = await createAdminClient()
  const { data: property } = await supabase.from("Property").select("id, wordpressId").eq("id", propertyId).single()

  if (!property || !(property as any).wordpressId) {
    throw new Error("Propiedad no encontrada o no sincronizada")
  }

  try {
    await wordpressAPI.deleteProperty((property as any).wordpressId)

    await supabase
      .from("Property")
      .update({
        wordpressId: null,
        wordpressSyncedAt: null,
      })
      .eq("id", propertyId)

    revalidatePath("/properties")
    revalidatePath(`/properties/${propertyId}`)

    return { success: true }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Error al eliminar de WordPress")
  }
}

export async function testWordPressConnection() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden probar la conexión")
  }

  try {
    const result = await wordpressAPI.testConnection()
    return result
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido al probar la conexión",
    }
  }
}

export async function debugWordPressProperty(propertyId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden usar el debug")
  }

  try {
    const result = await wordpressAPI.debugProperty(propertyId)
    return result
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error desconocido al inspeccionar la propiedad",
    }
  }
}
