"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { hasUserPermission } from "@/lib/permissions"
import { wordpressAPI } from "@/lib/wordpress"
import { revalidatePath } from "next/cache"

export async function syncPropertyToWordPress(propertyId: string) {
  console.log("[v0] ========================================")
  console.log("[v0] syncPropertyToWordPress called with ID:", propertyId)
  console.log("[v0] ========================================")

  const currentUser = await getCurrentUser()

  if (!currentUser) {
    console.log("[v0] ERROR: User not authenticated")
    throw new Error("No estás autenticado")
  }

  console.log("[v0] User authenticated:", currentUser.id, currentUser.role)

  const canEdit = await hasUserPermission(currentUser.id, "properties.edit")
  if (!canEdit) {
    console.log("[v0] ERROR: User does not have properties.edit permission")
    throw new Error("No tienes permisos para sincronizar propiedades")
  }

  console.log("[v0] User has permission to edit properties")

  const supabase = await createAdminClient()
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select(`
      *,
      property_type:property_types!property_type_id(name),
      owner:owners!owner_id(name),
      city:cities!city_id(name),
      province:provinces!province_id(name),
      country:countries!country_id(name),
      neighborhood:neighborhoods!neighborhood_id(name)
    `)
    .eq("id", propertyId)
    .single()

  if (fetchError) {
    console.log("[v0] ERROR fetching property:", fetchError)
    throw new Error(`Error al obtener la propiedad: ${fetchError.message}`)
  }

  if (!property) {
    console.log("[v0] ERROR: Property not found")
    throw new Error("Propiedad no encontrada")
  }

  console.log("[v0] Property fetched successfully:", {
    id: property.id,
    title: property.title,
    images: property.images?.length || 0,
    lot_size: property.lot_size,
    area: property.area,
    property_type: property.property_type?.name,
    transaction_type: property.transaction_type,
    status: property.status,
  })

  const allImages = property.images || []
  const imagesToSync = allImages.filter((img: any) => img.syncToWordPress === true)

  console.log("[v0] Total images:", allImages.length)
  console.log("[v0] Images marked for WordPress sync:", imagesToSync.length)

  if (imagesToSync.length === 0) {
    console.log("[v0] ERROR: No images marked for WordPress sync")
    throw new Error("Debe seleccionar al menos una imagen para sincronizar con WordPress (portada)")
  }

  try {
    console.log("[v0] Calling wordpressAPI.syncProperty...")

    const syncData = {
      id: property.id,
      wordpressId: property.wordpress_id,
      title: property.title,
      description: property.description,
      propertyType: property.property_type?.name,
      transactionType: property.transaction_type,
      status: property.status,
      address: property.address,
      city: property.city?.name,
      state: property.province?.name,
      country: property.country?.name,
      zipCode: property.zip_code,
      latitude: property.latitude,
      longitude: property.longitude,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parking_spaces,
      area: property.area,
      lotSize: property.lot_size,
      yearBuilt: property.year_built,
      price: property.price,
      currency: property.currency,
      pricePerM2: property.price_per_m2,
      features: property.features,
      amenities: property.amenities,
      images: imagesToSync,
      virtualTour: property.virtual_tour,
      propertyLabel: property.property_label,
      published: property.published,
    }

    console.log("[v0] Sync data prepared with", imagesToSync.length, "images")

    const wordpressId = await wordpressAPI.syncProperty(syncData)

    console.log("[v0] WordPress sync successful! WordPress ID:", wordpressId)

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        wordpress_id: wordpressId,
        wordpress_synced_at: new Date().toISOString(),
      })
      .eq("id", propertyId)

    if (updateError) {
      console.log("[v0] ERROR updating property with wordpress_id:", updateError)
    } else {
      console.log("[v0] Property updated with WordPress ID")
    }

    revalidatePath("/properties")
    revalidatePath(`/properties/${propertyId}`)

    return { success: true, wordpressId }
  } catch (error) {
    console.error("[v0] ========================================")
    console.error("[v0] WordPress sync FAILED!")
    console.error("[v0] Error:", error)
    console.error("[v0] ========================================")
    throw new Error(error instanceof Error ? error.message : "Error al sincronizar con WordPress")
  }
}

export async function syncAllPropertiesToWordPress() {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden sincronizar todas las propiedades")
  }

  const supabase = await createAdminClient()
  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      property_type:property_types!property_type_id(name),
      owner:owners!owner_id(name),
      city:cities!city_id(name),
      province:provinces!province_id(name),
      country:countries!country_id(name),
      neighborhood:neighborhoods!neighborhood_id(name)
    `)
    .eq("published", true)

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const property of properties || []) {
    try {
      if (!property.images || property.images.length === 0) {
        throw new Error("La propiedad debe tener al menos una imagen para sincronizar con WordPress")
      }

      const wordpressId = await wordpressAPI.syncProperty({
        id: property.id,
        wordpressId: property.wordpress_id,
        title: property.title,
        description: property.description,
        propertyType: property.property_type?.name,
        transactionType: property.transaction_type,
        status: property.status,
        address: property.address,
        city: property.city?.name,
        state: property.province?.name,
        country: property.country?.name,
        zipCode: property.zip_code,
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parking_spaces,
        area: property.area,
        lotSize: property.lot_size,
        yearBuilt: property.year_built,
        price: property.price,
        currency: property.currency,
        pricePerM2: property.price_per_m2,
        features: property.features,
        amenities: property.amenities,
        images: property.images,
        virtualTour: property.virtual_tour,
        propertyLabel: property.property_label,
        published: property.published,
      })

      await supabase
        .from("properties")
        .update({
          wordpress_id: wordpressId,
          wordpress_synced_at: new Date().toISOString(),
        })
        .eq("id", property.id)

      results.success++
    } catch (error) {
      results.failed++
      results.errors.push(`${property.title}: ${error instanceof Error ? error.message : "Error desconocido"}`)
      console.error(`[v0] Error syncing property ${property.id}:`, error)
    }
  }

  revalidatePath("/properties")

  return results
}

export async function deletePropertyFromWordPress(propertyId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  const canDelete = await hasUserPermission(currentUser.id, "properties.delete")
  if (!canDelete) {
    throw new Error("No tienes permisos para eliminar propiedades de WordPress")
  }

  const supabase = await createAdminClient()
  const { data: property } = await supabase.from("properties").select("id, wordpress_id").eq("id", propertyId).single()

  if (!property || !property.wordpress_id) {
    throw new Error("Propiedad no encontrada o no sincronizada")
  }

  try {
    await wordpressAPI.deleteProperty(property.wordpress_id)

    await supabase
      .from("properties")
      .update({
        wordpress_id: null,
        wordpress_synced_at: null,
      })
      .eq("id", propertyId)

    revalidatePath("/properties")
    revalidatePath(`/properties/${propertyId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] WordPress delete error:", error)
    throw new Error(error instanceof Error ? error.message : "Error al eliminar de WordPress")
  }
}

export async function testWordPressConnection() {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "ADMIN") {
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
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "ADMIN") {
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
