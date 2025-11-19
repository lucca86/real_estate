"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { wordpressAPI } from "@/lib/wordpress"
import { revalidatePath } from "next/cache"

export async function syncPropertyToWordPress(propertyId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
    throw new Error("No tienes permisos para sincronizar propiedades")
  }

  const supabase = await createServerClient()
  const { data: property } = await supabase
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

  if (!property) {
    throw new Error("Propiedad no encontrada")
  }

  console.log("[v0] Syncing property from sync button:", {
    id: property.id,
    title: property.title,
    propertyLabel: property.property_label,
    hasPropertyLabel: !!property.property_label,
    propertyLabelType: typeof property.property_label,
    allFields: {
      status: property.status,
      transactionType: property.transaction_type,
      published: property.published,
      syncToWordPress: property.sync_to_wordpress,
    },
  })

  try {
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
        synced_at: new Date().toISOString(),
      })
      .eq("id", propertyId)

    revalidatePath("/properties")
    revalidatePath(`/properties/${propertyId}`)

    return { success: true, wordpressId }
  } catch (error) {
    console.error("[v0] WordPress sync error:", error)
    throw new Error(error instanceof Error ? error.message : "Error al sincronizar con WordPress")
  }
}

export async function syncAllPropertiesToWordPress() {
  const currentUser = await getCurrentUser()

  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden sincronizar todas las propiedades")
  }

  const supabase = await createServerClient()
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
          synced_at: new Date().toISOString(),
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

  if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
    throw new Error("No tienes permisos para eliminar propiedades de WordPress")
  }

  const supabase = await createServerClient()
  const { data: property } = await supabase
    .from("properties")
    .select("id, wordpress_id")
    .eq("id", propertyId)
    .single()

  if (!property || !property.wordpress_id) {
    throw new Error("Propiedad no encontrada o no sincronizada")
  }

  try {
    await wordpressAPI.deleteProperty(property.wordpress_id)

    await supabase
      .from("properties")
      .update({
        wordpress_id: null,
        synced_at: null,
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
