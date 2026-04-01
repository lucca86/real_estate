"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
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
    .from("properties")
    .select(`
      *,
      property_type:property_types!property_type_id(name),
      city:cities!city_id(name),
      province:provinces!province_id(name),
      country:countries!country_id(name),
      neighborhood:neighborhoods!neighborhood_id(name)
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
    console.log("[v0] Calling wordpressAPI.syncProperty...")
    console.log("[v0] Property wordpress_id from database:", property.wordpress_id)
    console.log("[v0] Property wordpress_url from database:", property.wordpress_url)

    const syncData = {
      id: property.id,
      wordpressId: property.wordpress_id,
      wordpress_id: property.wordpress_id, // Also pass as wordpress_id for compatibility
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

    const result = await wordpressAPI.syncProperty(syncData)

    console.log("[v0] WordPress sync successful! WordPress ID:", result.id, "URL:", result.url)

    const { error: updateError } = await adminClient
      .from("properties")
      .update({
        wordpress_id: result.id,
        wordpress_url: result.url,
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

    return { success: true, wordpressId: result.id }
  } catch (error) {
    console.error("[v0] ========================================")
    console.error("[v0] WordPress sync FAILED!")
    console.error("[v0] Error:", error)
    console.error("[v0] ========================================")
    throw new Error(error instanceof Error ? error.message : "Error al sincronizar con WordPress")
  }
}

export async function syncAllPropertiesToWordPress() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden sincronizar todas las propiedades")
  }

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No estás autenticado")
  }

  if (user.user_metadata?.role !== "ADMIN") {
    throw new Error("No tienes permisos para eliminar propiedades de WordPress")
  }

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
