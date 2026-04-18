"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { syncPropertyToWordPress, deletePropertyFromWordPress } from "./wordpress"
import { wordpressAPI } from "@/lib/wordpress"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import type { PropertyWithDetails } from "@/types"
import type { ActionResult } from "@/types/action-result"
import { logAudit } from "@/lib/audit"

export async function createProperty(formData: FormData): Promise<ActionResult<PropertyWithDetails>> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: "No autenticado. Por favor inicia sesión." }
  }

  const supabase = await createAdminClient()

  try {

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const ownerId = formData.get("ownerId") as string
    const propertyTypeId = formData.get("propertyTypeId") as string
    const status = formData.get("status") as string
    const address = formData.get("address") as string
    const cityId = formData.get("cityId") as string
    const countryId = formData.get("countryId") as string
    const provinceId = formData.get("provinceId") as string
    const neighborhoodId = formData.get("neighborhoodId") as string
    const latitude = formData.get("latitude") as string
    const longitude = formData.get("longitude") as string
    const bedrooms = formData.get("bedrooms") as string
    const bathrooms = formData.get("bathrooms") as string
    const parkingSpaces = formData.get("parkingSpaces") as string
    const area = formData.get("area") as string
    const lotSize = formData.get("lotSize") as string
    const yearBuilt = formData.get("yearBuilt") as string
    const transactionType = formData.get("transactionType") as string
    const rentalPeriod = formData.get("rentalPeriod") as string
    const zipCode = formData.get("zipCode") as string
    const price = formData.get("price") as string
    const currency = formData.get("currency") as string
    const rentalPrice = formData.get("rentalPrice") as string
    const amenities = formData.get("amenities") as string
    const imagesJson = formData.get("images") as string
    const isFeatured = formData.get("isFeatured") === "true"
    const propertyLabel = formData.get("propertyLabel") as string
    const features = formData.get("features") as string
    const videos = formData.get("videos") as string
    const virtualTour = formData.get("virtualTour") as string
    const published = formData.get("published") === "true"
    const syncToWordPress = formData.get("syncToWordPress") === "true"
    const frontMeters = formData.get("frontMeters") ? Number.parseFloat(formData.get("frontMeters") as string) : null
    const backMeters = formData.get("backMeters") ? Number.parseFloat(formData.get("backMeters") as string) : null
    const adrema = formData.get("adrema") as string

    if (!title || !ownerId || !propertyTypeId || !status || !address || !cityId || !countryId || !provinceId) {
      return { success: false, error: "Faltan campos requeridos" }
    }

    let parsedImages: any[] = []
    try {
      parsedImages = imagesJson ? JSON.parse(imagesJson) : []
    } catch {
      return { success: false, error: "Error al procesar las imágenes" }
    }

    const sortedImages = parsedImages.sort((a, b) => (a.order || 0) - (b.order || 0))

    const parsedLatitude = latitude ? Number.parseFloat(latitude) : null
    const parsedLongitude = longitude ? Number.parseFloat(longitude) : null

    if (parsedLatitude !== null && (isNaN(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) {
      throw new Error("La latitud debe estar entre -90 y 90")
    }

    if (parsedLongitude !== null && (isNaN(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180)) {
      throw new Error("La longitud debe estar entre -180 y 180")
    }

    const parsedArea = area ? Number.parseFloat(area) : null
    const parsedBedrooms = bedrooms ? Number.parseInt(bedrooms) : null
    const parsedBathrooms = bathrooms ? Number.parseInt(bathrooms) : null
    const parsedParkingSpaces = parkingSpaces ? Number.parseInt(parkingSpaces) : null
    const parsedLotSize = lotSize ? Number.parseFloat(lotSize) : null
    const parsedYearBuilt = yearBuilt ? Number.parseInt(yearBuilt) : null

    const pricePerM2 = price && parsedArea ? Number.parseFloat(price) / parsedArea : null

    const { data: newProperty, error } = await supabase
      .from("properties")
      .insert({
        id: crypto.randomUUID(),
        title,
        description: description || null,
        owner_id: ownerId,
        property_type_id: propertyTypeId,
        status,
        address,
        city_id: cityId,
        country_id: countryId,
        province_id: provinceId,
        neighborhood_id: neighborhoodId || null,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        bedrooms: parsedBedrooms,
        bathrooms: parsedBathrooms,
        parking_spaces: parsedParkingSpaces,
        area: parsedArea,
        lot_size: parsedLotSize,
        year_built: parsedYearBuilt,
        transaction_type: transactionType,
        rental_period: rentalPeriod || null,
        zip_code: zipCode || null,
        price: price ? Number.parseFloat(price) : null,
        price_per_m2: pricePerM2,
        currency,
        rental_price: rentalPrice ? Number.parseFloat(rentalPrice) : null,
        amenities: parseArrayField(amenities),
        images: sortedImages,
        property_label: propertyLabel && propertyLabel !== "NONE" ? propertyLabel : null,
        adrema: adrema || null,
        features: parseArrayField(features),
        videos: videos ? JSON.parse(videos) : [],
        virtual_tour: virtualTour || null,
        published,
        sync_to_wordpress: syncToWordPress,
        created_by_id: currentUser.id,
        updated_by_id: currentUser.id,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al crear la propiedad: ${error.message}`)

    if (syncToWordPress && newProperty) {
      try {
        const imagesToSync = sortedImages.filter((img: any) => img.syncToWordPress === true)

        if (imagesToSync.length === 0) {
          return {
            success: true,
            data: newProperty as PropertyWithDetails,
            warning:
              "La propiedad se guardó pero no se sincronizó con WordPress. Debe seleccionar al menos una imagen para la portada de WordPress.",
          }
        }

        await syncPropertyToWordPress(newProperty.id)
      } catch (wpError: any) {
        return {
          success: true,
          data: newProperty as PropertyWithDetails,
          warning: wpError.message || "Error al sincronizar con WordPress",
        }
      }
    }

    await logAudit({
      module: "properties",
      action: "create",
      entity_type: "Propiedad",
      entity_id: newProperty.id,
      metadata: { title: newProperty.title, status: newProperty.status },
    })
    revalidatePath("/")
    revalidatePath("/properties")
    return { success: true, data: newProperty as PropertyWithDetails }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error desconocido al crear la propiedad",
    }
  }
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  const supabase = await createAdminClient()

  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single()

  if (fetchError || !property) {
    throw new Error("Propiedad no encontrada")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const ownerId = formData.get("ownerId") as string
  const propertyTypeId = formData.get("propertyTypeId") as string
  const status = formData.get("status") as string
  const transactionType = formData.get("transactionType") as string
  const rentalPeriod = formData.get("rentalPeriod") as string
  const address = formData.get("address") as string
  const countryId = formData.get("countryId") as string
  const provinceId = formData.get("provinceId") as string
  const cityId = formData.get("cityId") as string
  const neighborhoodId = formData.get("neighborhoodId") as string
  const zipCode = formData.get("zipCode") as string
  const price = formData.get("price") as string
  const currency = formData.get("currency") as string
  const rentalPrice = formData.get("rentalPrice") as string
  const amenities = formData.get("amenities") as string
  const imagesJson = formData.get("images") as string
  const isFeatured = formData.get("isFeatured") === "true"
  const propertyLabel = formData.get("propertyLabel") as string
  const features = formData.get("features") as string
  const videos = formData.get("videos") as string
  const virtualTour = formData.get("virtualTour") as string
  const published = formData.get("published") === "true"
  const syncToWordPress = formData.get("syncToWordPress") === "true"
  const frontMeters = formData.get("frontMeters") ? Number.parseFloat(formData.get("frontMeters") as string) : null
  const backMeters = formData.get("backMeters") ? Number.parseFloat(formData.get("backMeters") as string) : null
  const latitude = formData.get("latitude") as string
  const longitude = formData.get("longitude") as string
  const bedrooms = formData.get("bedrooms") as string
  const bathrooms = formData.get("bathrooms") as string
  const parkingSpaces = formData.get("parkingSpaces") as string
  const area = formData.get("area") as string
  const lotSize = formData.get("lotSize") as string
  const yearBuilt = formData.get("yearBuilt") as string
  const adrema = formData.get("adrema") as string

  const parsedImages: any[] = imagesJson ? JSON.parse(imagesJson) : []

  if (!parsedImages || parsedImages.length === 0) {
    throw new Error("Debes agregar al menos una imagen a la propiedad")
  }

  const sortedImages = parsedImages.sort((a, b) => (a.order || 0) - (b.order || 0))

  const parsedLatitude = latitude ? Number.parseFloat(latitude) : null
  const parsedLongitude = longitude ? Number.parseFloat(longitude) : null

  if (parsedLatitude !== null && (isNaN(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) {
    throw new Error("La latitud debe estar entre -90 y 90")
  }

  if (parsedLongitude !== null && (isNaN(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180)) {
    throw new Error("La longitud debe estar entre -180 y 180")
  }

  const parsedArea = area ? Number.parseFloat(area) : null
  const parsedBedrooms = bedrooms ? Number.parseInt(bedrooms) : null
  const parsedBathrooms = bathrooms ? Number.parseInt(bathrooms) : null
  const parsedParkingSpaces = parkingSpaces ? Number.parseInt(parkingSpaces) : null
  const parsedLotSize = lotSize ? Number.parseFloat(lotSize) : null
  const parsedYearBuilt = yearBuilt ? Number.parseInt(yearBuilt) : null

  const pricePerM2 = price && parsedArea ? Number.parseFloat(price) / parsedArea : null

  const { data: updatedProperty, error: updateError } = await supabase
    .from("properties")
    .update({
      title,
      description: description || null,
      owner_id: ownerId,
      property_type_id: propertyTypeId,
      status,
      address,
      city_id: cityId,
      country_id: countryId,
      province_id: provinceId,
      neighborhood_id: neighborhoodId || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      bedrooms: parsedBedrooms,
      bathrooms: parsedBathrooms,
      parking_spaces: parsedParkingSpaces,
      area: parsedArea,
      lot_size: parsedLotSize,
      year_built: parsedYearBuilt,
      transaction_type: transactionType,
      rental_period: rentalPeriod || null,
      zip_code: zipCode || null,
      price: price ? Number.parseFloat(price) : null,
      price_per_m2: pricePerM2,
      currency,
      rental_price: rentalPrice ? Number.parseFloat(rentalPrice) : null,
      amenities: parseArrayField(amenities),
      images: sortedImages,
      property_label: propertyLabel && propertyLabel !== "NONE" ? propertyLabel : null,
      adrema: adrema || null,
      features: parseArrayField(features),
      videos: videos ? JSON.parse(videos) : [],
      virtual_tour: virtualTour || null,
      published,
      sync_to_wordpress: syncToWordPress,
      updated_by_id: currentUser.id,
    })
    .eq("id", propertyId)
    .select()
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (!updatedProperty) {
    throw new Error("Error al actualizar la propiedad")
  }

  try {
    if (syncToWordPress) {
      const imagesToSync = sortedImages.filter((img: any) => img.syncToWordPress === true)

      if (imagesToSync.length === 0) {
        revalidatePath("/properties")
        revalidatePath("/catalog")
        revalidatePath(`/properties/${propertyId}/edit`)
        return {
          success: true,
          data: updatedProperty,
          warning:
            "La propiedad se guardó correctamente, pero NO se sincronizó con WordPress porque no hay imágenes seleccionadas para la portada. Marque al menos una imagen para sincronizar.",
        }
      }

      const adminClient = await createAdminClient()
      const { data: propertyWithRelations } = await adminClient
        .from("properties")
        .select(`
          *,
          propertyType:property_types!properties_property_type_id_fkey(name),
          city:cities!properties_city_id_fkey(name),
          province:provinces!properties_province_id_fkey(name),
          country:countries!properties_country_id_fkey(name),
          neighborhood:neighborhoods!properties_neighborhood_id_fkey(name)
        `)
        .eq("id", updatedProperty.id)
        .single()

      if (propertyWithRelations) {
        try {
          await syncPropertyToWordPress(updatedProperty.id)
        } catch (syncError) {
          revalidatePath("/properties")
          revalidatePath("/catalog")
          revalidatePath(`/properties/${propertyId}/edit`)
          return {
            success: true,
            data: updatedProperty,
            warning: syncError instanceof Error ? syncError.message : "Error al sincronizar con WordPress",
          }
        }
      }
    }
  } catch (syncError) {
    revalidatePath("/properties")
    revalidatePath("/catalog")
    revalidatePath(`/properties/${propertyId}/edit`)
    return {
      success: true,
      data: updatedProperty,
      warning: syncError instanceof Error ? syncError.message : "Error al sincronizar con WordPress",
    }
  }

  await logAudit({
    module: "properties",
    action: "update",
    entity_type: "Propiedad",
    entity_id: propertyId,
    metadata: { title: (updatedProperty as any).title, status: (updatedProperty as any).status },
  })
  revalidatePath("/properties")
  revalidatePath("/catalog")
  revalidatePath(`/properties/${propertyId}/edit`)

  return { success: true, data: updatedProperty }
}

export async function deletePropertyImage(propertyId: string, imageId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { success: false, error: "No estás autenticado" }
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR") {
    return { success: false, error: "No tienes permisos para eliminar imágenes" }
  }

  try {
    const supabase = await createAdminClient()

    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("id, images")
      .eq("id", propertyId)
      .single()

    if (fetchError || !property) {
      return { success: false, error: "Propiedad no encontrada" }
    }

    const currentImages: any[] = Array.isArray(property.images) ? property.images : []
    const updatedImages = currentImages.filter((img: any) => img.id !== imageId)

    // If the removed image was the cover, promote the first remaining image
    const removedImage = currentImages.find((img: any) => img.id === imageId)
    if (removedImage?.isCover && updatedImages.length > 0) {
      updatedImages[0] = { ...updatedImages[0], isCover: true }
    }

    const { error: updateError } = await supabase
      .from("properties")
      .update({ images: updatedImages })
      .eq("id", propertyId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath(`/properties/${propertyId}/edit`)
    revalidatePath(`/properties/${propertyId}`)
    revalidatePath("/properties")

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar imagen" }
  }
}

export async function deleteProperty(propertyId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { success: false, error: "No estás autenticado" }
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR" && currentUser.role !== "VENDEDOR") {
    return { success: false, error: "No tienes permisos para eliminar esta propiedad" }
  }

  try {
    const supabase = await createAdminClient()

    const { data: property, error: fetchError} = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single()

    if (fetchError || !property) {
      return { success: false, error: "Propiedad no encontrada" }
    }

    // In restricted mode, VENDEDOR can only delete their own properties
    if (currentUser.role === "VENDEDOR") {
      const { getPropertyEditMode } = await import("@/lib/actions/system-settings")
      const editMode = await getPropertyEditMode()
      if (editMode === "restricted" && property.created_by_id && property.created_by_id !== currentUser.id) {
        return { success: false, error: "Solo puedes eliminar propiedades que hayas creado" }
      }
    }

    // Delete from WordPress first if synced
    if (property.wordpress_id && property.wordpress_id > 0) {
      try {
        await wordpressAPI.deleteProperty(property.wordpress_id)
      } catch {
        // Continue with local deletion even if WordPress fails
      }
    }

    const { error: deleteError } = await supabase.from("properties").delete().eq("id", propertyId)

    if (deleteError) {
      if (deleteError.code === "23503") {
        const { error: updateError } = await supabase
          .from("properties")
          .update({ status: "ELIMINADO" })
          .eq("id", propertyId)

        if (updateError) return { success: false, error: `Error al desactivar propiedad: ${updateError.message}` }

        revalidatePath("/")
        revalidatePath("/properties")
        revalidatePath("/dashboard")
        return {
          success: true,
          wasDeactivated: true,
          message: `No se puede eliminar la propiedad porque tiene registros asociados. Se marcó como inactiva.`,
        }
      }

      return { success: false, error: `Error deleting property: ${deleteError.message}` }
    }

    await logAudit({
      module: "properties",
      action: "delete",
      entity_type: "Propiedad",
      entity_id: propertyId,
    })
    revalidatePath("/")
    revalidatePath("/properties")
    revalidatePath("/dashboard")
    return { success: true, wasDeactivated: false }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar propiedad" }
  }
}

export async function getPropertyById(id: string) {
  const supabase = await createAdminClient()

  const { data: property, error } = await supabase
    .from("properties")
    .select(`
      *,
      owner:owners!properties_owner_id_fkey(
        id,
        name,
        email,
        phone,
        secondary_phone,
        id_number,
        tax_id,
        address,
        notes,
        is_active,
        city:cities!owners_city_id_fkey(id, name),
        province:provinces!owners_province_id_fkey(id, name),
        country:countries!owners_country_id_fkey(id, name)
      ),
      city:cities!properties_city_id_fkey(id, name),
      province:provinces!properties_province_id_fkey(id, name),
      country:countries!properties_country_id_fkey(id, name),
      neighborhood:neighborhoods!properties_neighborhood_id_fkey(id, name),
      propertyType:property_types!properties_property_type_id_fkey(id, name)
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) return null

  if (!property) {
    return null
  }

  const p = property as any
  let createdBy = null
  let updatedBy = null

  if (p.created_by_id) {
    const { data: creator } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", p.created_by_id)
      .single()
    createdBy = creator
  }

  if (p.updated_by_id) {
    const { data: updater } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", p.updated_by_id)
      .single()
    updatedBy = updater
  }

  return { ...property, createdBy, updatedBy }
}

const parseArrayField = (value: any): string[] => {
  if (!value) return []

  // If it's already a clean array of strings, return it
  if (Array.isArray(value)) {
    // Check if array contains escaped JSON strings like ["[\"item\"]"]
    const cleanedArray = value
      .flatMap((item) => {
        if (typeof item === "string") {
          // Remove escaped quotes and brackets
          let cleaned = item.trim()

          // If it starts with [" and ends with "], it's a corrupted JSON string
          if (cleaned.startsWith('["') || cleaned.startsWith("['")) {
            try {
              // Try to parse the inner JSON
              const parsed = JSON.parse(cleaned)
              return Array.isArray(parsed) ? parsed : [cleaned]
            } catch {
              // If parsing fails, clean manually
              cleaned = cleaned.replace(/^\["|"\]$/g, "") // Remove [" and "]
              cleaned = cleaned.replace(/^\\"|"\\/g, "") // Remove escaped quotes
              cleaned = cleaned.replace(/\\\\/g, "") // Remove escaped backslashes
              return cleaned
            }
          }
          return cleaned
        }
        return item
      })
      .filter(Boolean)

    return cleanedArray
  }

  // If it's a string, try to parse or split
  if (typeof value === "string") {
    // Try JSON parse first
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        // Recursively clean the parsed array
        return parseArrayField(parsed)
      }
    } catch {
      // Not JSON, try comma-separated
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }
  }

  return []
}
