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
  const adminClient = await createAdminClient()

  const { data: property, error } = await adminClient
    .from("properties")
    .select(`
      *,
      property_type:property_types!properties_property_type_id_fkey(name),
      city:cities!properties_city_id_fkey(name),
      province:provinces!properties_province_id_fkey(name),
      country:countries!properties_country_id_fkey(name),
      neighborhood:neighborhoods!properties_neighborhood_id_fkey(name)
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
      wordpressId: p.wordpress_id,
      wordpress_id: p.wordpress_id,
      title: property.title,
      description: property.description,
      propertyType: p.property_type?.name,
      transactionType: p.transaction_type,
      status: property.status,
      address: property.address,
      city: p.city?.name,
      state: p.province?.name,
      country: p.country?.name,
      zipCode: p.zip_code,
      latitude: property.latitude,
      longitude: property.longitude,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: p.parking_spaces,
      area: property.area,
      lotSize: p.lot_size,
      yearBuilt: p.year_built,
      price: property.price,
      currency: property.currency,
      pricePerM2: p.price_per_m2,
      features: property.features,
      amenities: property.amenities,
      images: imagesToSync,
      virtualTour: p.virtual_tour,
      propertyLabel: p.property_label,
      published: property.published,
    }

    const result = await wordpressAPI.syncProperty(syncData)

    await adminClient
      .from("properties")
      .update({
        wordpress_id: result.id,
        wordpress_url: result.url,
        wordpress_synced_at: new Date().toISOString(),
      })
      .eq("id", propertyId)

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
    .from("properties")
    .select(`
      *,
      property_type:property_types!properties_property_type_id_fkey(name),
      owner:owners!properties_owner_id_fkey(name),
      city:cities!properties_city_id_fkey(name),
      province:provinces!properties_province_id_fkey(name),
      country:countries!properties_country_id_fkey(name),
      neighborhood:neighborhoods!properties_neighborhood_id_fkey(name)
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

      const p = property as any
      const wordpressResult = await wordpressAPI.syncProperty({
        id: property.id,
        wordpressId: p.wordpress_id,
        title: property.title,
        description: property.description,
        propertyType: p.property_type?.name,
        transactionType: p.transaction_type,
        status: property.status,
        address: property.address,
        city: p.city?.name,
        state: p.province?.name,
        country: p.country?.name,
        zipCode: p.zip_code,
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: p.parking_spaces,
        area: property.area,
        lotSize: p.lot_size,
        yearBuilt: p.year_built,
        price: property.price,
        currency: property.currency,
        pricePerM2: p.price_per_m2,
        features: property.features,
        amenities: property.amenities,
        images: imagesToSync,
        virtualTour: p.virtual_tour,
        propertyLabel: p.property_label,
        published: property.published,
      })

      await supabase
        .from("properties")
        .update({
          wordpress_id: wordpressResult.id,
          wordpress_synced_at: new Date().toISOString(),
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
  const { data: property } = await supabase
    .from("properties")
    .select("id, wordpress_id")
    .eq("id", propertyId)
    .single()

  if (!property || !(property as any).wordpress_id) {
    throw new Error("Propiedad no encontrada o no sincronizada")
  }

  try {
    await wordpressAPI.deleteProperty((property as any).wordpress_id)

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
    throw new Error(error instanceof Error ? error.message : "Error al eliminar de WordPress")
  }
}
