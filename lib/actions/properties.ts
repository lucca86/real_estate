"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { syncPropertyToWordPress, deletePropertyFromWordPress } from "./wordpress"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import type { PropertyWithDetails } from "@/types"
import type { ActionResult } from "@/types/action-result"

export async function createProperty(formData: FormData): Promise<ActionResult<PropertyWithDetails>> {
  console.log("[v0] createProperty called")

  const currentUser = await getCurrentUser()
  if (!currentUser) {
    console.log("[v0] No authenticated user")
    return { success: false, error: "No autenticado. Por favor inicia sesión." }
  }

  console.log("[v0] User authenticated:", currentUser.id)

  const supabase = await createClient()

  try {
    // Extract form data
    console.log("[v0] Extracting form data")

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

    console.log("[v0] Form data extracted:", { title, ownerId, propertyTypeId, status, cityId })

    if (!title || !ownerId || !propertyTypeId || !status || !address || !cityId || !countryId || !provinceId) {
      console.log("[v0] Missing required fields")
      return { success: false, error: "Faltan campos requeridos" }
    }

    let parsedImages: any[] = []
    try {
      parsedImages = imagesJson ? JSON.parse(imagesJson) : []
    } catch (e) {
      console.error("[v0] Error parsing images:", e)
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

    console.log("[v0] About to insert into database")

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
        frontSize: frontMeters,
        depthSize: backMeters,
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
        is_featured: isFeatured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database insert error:", error)
      throw new Error(`Error al crear la propiedad: ${error.message}`)
    }

    console.log("[v0] Property created successfully:", newProperty?.id)

    if (syncToWordPress && newProperty) {
      try {
        const imagesToSync = sortedImages
          .filter((img: any) => img.syncToWordPress)
          .map((img: any) => img.sizes?.large || img.url)

        if (imagesToSync.length > 0) {
          // Call the WordPress sync action which will handle updating wordpress_synced_at
          await syncPropertyToWordPress(newProperty.id)
        } else {
          console.log("Skipping WordPress sync: No images marked for sync")
        }
      } catch (wpError: any) {
        console.error("Error in WordPress sync process:", wpError)
      }
    }

    console.log("[v0] About to revalidate and return")
    revalidatePath("/")
    revalidatePath("/properties")
    console.log("[v0] Returning success")
    return { success: true, data: newProperty as PropertyWithDetails }
  } catch (error: any) {
    console.error("[v0] Error in createProperty:", error)
    console.error("[v0] Error stack:", error.stack)
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

  const supabase = await createClient()

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
      frontSize: frontMeters,
      depthSize: backMeters,
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
      updated_at: new Date().toISOString(),
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
      const imagesToSync = sortedImages
        .filter((img: any) => img.syncToWordPress)
        .map((img: any) => img.sizes?.large || img.url)

      if (imagesToSync.length > 0) {
        const adminClient = await createAdminClient()
        const { data: propertyWithRelations } = await adminClient
          .from("properties")
          .select(`
            *,
            propertyType:property_types!property_type_id(name),
            city:cities!city_id(name),
            province:provinces!province_id(name),
            country:countries!country_id(name),
            neighborhood:neighborhoods!neighborhood_id(name)
          `)
          .eq("id", updatedProperty.id)
          .single()

        if (propertyWithRelations) {
          try {
            await syncPropertyToWordPress(updatedProperty.id)
          } catch (syncError) {
            console.error("[v0] WordPress sync failed:", syncError)
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
    }
  } catch (syncError) {
    console.error("[v0] WordPress sync failed:", syncError)
    revalidatePath("/properties")
    revalidatePath("/catalog")
    revalidatePath(`/properties/${propertyId}/edit`)
    return {
      success: true,
      data: updatedProperty,
      warning: syncError instanceof Error ? syncError.message : "Error al sincronizar con WordPress",
    }
  }

  revalidatePath("/properties")
  revalidatePath("/catalog")
  revalidatePath(`/properties/${propertyId}/edit`)

  return { success: true, data: updatedProperty }
}

export async function deleteProperty(propertyId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return { success: false, error: "No estás autenticado" }
  }

  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR") {
    return { success: false, error: "No tienes permisos para eliminar esta propiedad" }
  }

  try {
    const supabase = await createClient()

    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single()

    if (fetchError || !property) {
      return { success: false, error: "Propiedad no encontrada" }
    }

    if (property.wordpress_id) {
      try {
        await deletePropertyFromWordPress(propertyId)
      } catch (wpError) {
        console.error("[v0] Error deleting from WordPress:", wpError)
        // Continue with local deletion even if WordPress fails
      }
    }

    const { error: deleteError } = await supabase.from("properties").delete().eq("id", propertyId)

    if (deleteError) {
      if (deleteError.code === "23503") {
        const { error: updateError } = await supabase
          .from("properties")
          .update({ is_active: false })
          .eq("id", propertyId)

        if (updateError) {
          console.error("Error deactivating property:", updateError)
          return { success: false, error: `Error al desactivar propiedad: ${updateError.message}` }
        }

        revalidatePath("/")
        revalidatePath("/properties")
        revalidatePath("/dashboard")
        return {
          success: true,
          wasDeactivated: true,
          message: `No se puede eliminar la propiedad porque tiene registros asociados. Se marcó como inactiva.`,
        }
      }

      console.error("Error deleting property:", deleteError)
      return { success: false, error: `Error deleting property: ${deleteError.message}` }
    }

    revalidatePath("/")
    revalidatePath("/properties")
    revalidatePath("/dashboard")
    return { success: true, wasDeactivated: false }
  } catch (error: any) {
    console.error("Error in deleteProperty:", error)
    return { success: false, error: error.message || "Error al eliminar propiedad" }
  }
}

export async function getPropertyById(id: string) {
  const supabase = await createClient()

  const { data: property, error } = await supabase
    .from("properties")
    .select(`
      *,
      owner:owners!owner_id(
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
        first_name,
        last_name,
        owner_type,
        real_estate_agency,
        city:cities!city_id(id, name),
        province:provinces!province_id(id, name),
        country:countries!country_id(id, name)
      ),
      city:cities!city_id(id, name),
      province:provinces!province_id(id, name),
      country:countries!country_id(id, name),
      neighborhood:neighborhoods!neighborhood_id(id, name),
      propertyType:property_types!property_type_id(id, name)
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching property:", error)
    return null
  }

  if (!property) {
    console.error("Property not found with id:", id)
    return null
  }

  return property
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
