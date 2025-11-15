"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { wordpressAPI } from "@/lib/wordpress"


export async function createProperty(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const adrema = formData.get("adrema") as string
  const ownerId = formData.get("ownerId") as string
  const propertyTypeId = formData.get("propertyTypeId") as string
  const transactionType = formData.get("transactionType") as string
  const status = formData.get("status") as string
  const rentalPeriod = formData.get("rentalPeriod") as string

  const address = formData.get("address") as string
  const countryId = formData.get("countryId") as string
  const provinceId = formData.get("provinceId") as string
  const cityId = formData.get("cityId") as string
  const neighborhoodId = formData.get("neighborhoodId") as string
  const zipCode = formData.get("zipCode") as string

  const latitude = formData.get("latitude") as string
  const longitude = formData.get("longitude") as string
  const bedrooms = formData.get("bedrooms") as string
  const bathrooms = formData.get("bathrooms") as string
  const parkingSpaces = formData.get("parkingSpaces") as string
  const area = formData.get("area") as string
  const lotSize = formData.get("lotSize") as string
  const yearBuilt = formData.get("yearBuilt") as string
  const price = formData.get("price") as string
  const currency = formData.get("currency") as string
  const rentalPrice = formData.get("rentalPrice") as string
  const features = formData.get("features") as string
  const amenities = formData.get("amenities") as string
  const images = formData.get("images") as string
  const videos = formData.get("videos") as string
  const virtualTour = formData.get("virtualTour") as string

  const propertyLabel = formData.get("propertyLabel") as string
  const syncToWordPress = formData.get("syncToWordPress") === "on"
  const published = formData.get("published") === "on"

  if (!title || !description || !address || !countryId || !provinceId || !cityId || !area || !price || !ownerId) {
    throw new Error("Todos los campos requeridos deben ser completados")
  }

  const pricePerM2 = Number.parseFloat(price) / Number.parseFloat(area)

  const supabase = await createServerClient()
  
  const { data: newProperty, error } = await supabase
    .from("properties")
    .insert({
      title,
      description,
      adrema: adrema || null,
      owner_id: ownerId,
      property_type_id: propertyTypeId || null,
      transaction_type: transactionType,
      status,
      rental_period: rentalPeriod && rentalPeriod !== "" ? rentalPeriod : null,
      address,
      country_id: countryId || null,
      province_id: provinceId || null,
      city_id: cityId || null,
      neighborhood_id: neighborhoodId || null,
      zip_code: zipCode || null,
      latitude: latitude ? Number.parseFloat(latitude) : null,
      longitude: longitude ? Number.parseFloat(longitude) : null,
      bedrooms: bedrooms ? Number.parseInt(bedrooms) : null,
      bathrooms: bathrooms ? Number.parseInt(bathrooms) : null,
      parking_spaces: parkingSpaces ? Number.parseInt(parkingSpaces) : null,
      area: Number.parseFloat(area),
      lot_size: lotSize ? Number.parseFloat(lotSize) : null,
      year_built: yearBuilt ? Number.parseInt(yearBuilt) : null,
      price: Number.parseFloat(price),
      price_per_m2: pricePerM2,
      currency,
      rental_price: rentalPrice ? Number.parseFloat(rentalPrice) : null,
      features: features ? features.split(",").map((f) => f.trim()) : [],
      amenities: amenities ? amenities.split(",").map((a) => a.trim()) : [],
      images: images ? images.split(",").map((i) => i.trim()) : [],
      videos: videos ? videos.split(",").map((v) => v.trim()) : [],
      virtual_tour: virtualTour || null,
      property_label: propertyLabel && propertyLabel !== "NONE" ? propertyLabel : null,
      sync_to_wordpress: syncToWordPress,
      published,
      created_by_id: currentUser.id,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating property:", error)
    throw new Error(`Error creating property: ${error.message}`)
  }

  if (syncToWordPress) {
    try {
      console.log("[v0] Syncing new property to WordPress:", newProperty.id)
      const wordpressId = await wordpressAPI.syncProperty({
        id: newProperty.id,
        title: newProperty.title,
        description: newProperty.description,
        propertyType: null,
        transactionType: newProperty.transaction_type,
        status: newProperty.status,
        address: newProperty.address,
        city: null,
        state: null,
        country: null,
        zipCode: newProperty.zip_code,
        latitude: newProperty.latitude,
        longitude: newProperty.longitude,
        bedrooms: newProperty.bedrooms,
        bathrooms: newProperty.bathrooms,
        parkingSpaces: newProperty.parking_spaces,
        area: newProperty.area,
        lotSize: newProperty.lot_size,
        yearBuilt: newProperty.year_built,
        price: newProperty.price,
        pricePerM2: newProperty.price_per_m2,
        features: newProperty.features,
        amenities: newProperty.amenities,
        images: newProperty.images,
        virtualTour: newProperty.virtual_tour,
        propertyLabel: newProperty.property_label,
        published: newProperty.published,
      })

      await supabase
        .from("properties")
        .update({ wordpress_id: wordpressId })
        .eq("id", newProperty.id)

      console.log("[v0] Property synced successfully to WordPress with ID:", wordpressId)
    } catch (error) {
      console.error("[v0] Error syncing property to WordPress:", error)
    }
  }

  revalidatePath("/properties")
  revalidatePath("/dashboard")
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  const supabase = await createServerClient()
  
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single()

  if (fetchError || !property) {
    throw new Error("Propiedad no encontrada")
  }

  if (property.created_by_id !== currentUser.id && currentUser.role === "VENDEDOR") {
    throw new Error("No tienes permisos para editar esta propiedad")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const adrema = formData.get("adrema") as string
  const ownerId = formData.get("ownerId") as string
  const propertyTypeId = formData.get("propertyTypeId") as string
  const transactionType = formData.get("transactionType") as string
  const status = formData.get("status") as string
  const rentalPeriod = formData.get("rentalPeriod") as string

  const address = formData.get("address") as string
  const countryId = formData.get("countryId") as string
  const provinceId = formData.get("provinceId") as string
  const cityId = formData.get("cityId") as string
  const neighborhoodId = formData.get("neighborhoodId") as string
  const zipCode = formData.get("zipCode") as string

  const latitude = formData.get("latitude") as string
  const longitude = formData.get("longitude") as string
  const bedrooms = formData.get("bedrooms") as string
  const bathrooms = formData.get("bathrooms") as string
  const parkingSpaces = formData.get("parkingSpaces") as string
  const area = formData.get("area") as string
  const lotSize = formData.get("lotSize") as string
  const yearBuilt = formData.get("yearBuilt") as string
  const price = formData.get("price") as string
  const currency = formData.get("currency") as string
  const rentalPrice = formData.get("rentalPrice") as string
  const features = formData.get("features") as string
  const amenities = formData.get("amenities") as string
  const images = formData.get("images") as string
  const videos = formData.get("videos") as string
  const virtualTour = formData.get("virtualTour") as string

  const propertyLabel = formData.get("propertyLabel") as string
  const syncToWordPress = formData.get("syncToWordPress") === "on"
  const published = formData.get("published") === "on"

  const pricePerM2 = Number.parseFloat(price) / Number.parseFloat(area)
  const finalPropertyLabel = propertyLabel && propertyLabel !== "NONE" ? propertyLabel : null

  const { data: updatedProperty, error: updateError } = await supabase
    .from("properties")
    .update({
      title,
      description,
      adrema: adrema || null,
      owner_id: ownerId,
      property_type_id: propertyTypeId || null,
      transaction_type: transactionType,
      status,
      rental_period: rentalPeriod && rentalPeriod !== "" ? rentalPeriod : null,
      address,
      country_id: countryId || null,
      province_id: provinceId || null,
      city_id: cityId || null,
      neighborhood_id: neighborhoodId || null,
      zip_code: zipCode || null,
      latitude: latitude ? Number.parseFloat(latitude) : null,
      longitude: longitude ? Number.parseFloat(longitude) : null,
      bedrooms: bedrooms ? Number.parseInt(bedrooms) : null,
      bathrooms: bathrooms ? Number.parseInt(bathrooms) : null,
      parking_spaces: parkingSpaces ? Number.parseInt(parkingSpaces) : null,
      area: Number.parseFloat(area),
      lot_size: lotSize ? Number.parseFloat(lotSize) : null,
      year_built: yearBuilt ? Number.parseInt(yearBuilt) : null,
      price: Number.parseFloat(price),
      price_per_m2: pricePerM2,
      currency,
      rental_price: rentalPrice ? Number.parseFloat(rentalPrice) : null,
      features: features ? features.split(",").map((f) => f.trim()) : [],
      amenities: amenities ? amenities.split(",").map((a) => a.trim()) : [],
      images: images ? images.split(",").map((i) => i.trim()) : [],
      videos: videos ? videos.split(",").map((v) => v.trim()) : [],
      virtual_tour: virtualTour || null,
      property_label: finalPropertyLabel,
      sync_to_wordpress: syncToWordPress,
      published,
    })
    .eq("id", propertyId)
    .select()
    .single()

  if (updateError) {
    console.error("[v0] Error updating property:", updateError)
    throw new Error(`Error updating property: ${updateError.message}`)
  }

  if (syncToWordPress) {
    try {
      console.log("[v0] Syncing updated property to WordPress:", updatedProperty.id)
      
      const wordpressId = await wordpressAPI.syncProperty({
        id: updatedProperty.id,
        wordpressId: updatedProperty.wordpress_id,
        title: updatedProperty.title,
        description: updatedProperty.description,
        propertyType: null,
        transactionType: updatedProperty.transaction_type,
        status: updatedProperty.status,
        address: updatedProperty.address,
        city: null,
        state: null,
        country: null,
        zipCode: updatedProperty.zip_code,
        latitude: updatedProperty.latitude,
        longitude: updatedProperty.longitude,
        bedrooms: updatedProperty.bedrooms,
        bathrooms: updatedProperty.bathrooms,
        parkingSpaces: updatedProperty.parking_spaces,
        area: updatedProperty.area,
        lotSize: updatedProperty.lot_size,
        yearBuilt: updatedProperty.year_built,
        price: updatedProperty.price,
        pricePerM2: updatedProperty.price_per_m2,
        features: updatedProperty.features,
        amenities: updatedProperty.amenities,
        images: updatedProperty.images,
        virtualTour: updatedProperty.virtual_tour,
        propertyLabel: updatedProperty.property_label,
        published: updatedProperty.published,
      })

      if (!updatedProperty.wordpress_id && wordpressId) {
        await supabase
          .from("properties")
          .update({ wordpress_id: wordpressId })
          .eq("id", updatedProperty.id)
      }

      console.log("[v0] Property synced successfully to WordPress with ID:", wordpressId)
    } catch (error) {
      console.error("[v0] Error syncing property to WordPress:", error)
      throw new Error(
        `Error al sincronizar con WordPress: ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  }

  revalidatePath("/properties")
  revalidatePath(`/properties/${propertyId}`)
  revalidatePath(`/properties/${propertyId}/edit`)
}

export async function deleteProperty(propertyId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  const supabase = await createServerClient()
  
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single()

  if (fetchError || !property) {
    throw new Error("Propiedad no encontrada")
  }

  if (property.created_by_id !== currentUser.id && currentUser.role !== "ADMIN") {
    throw new Error("No tienes permisos para eliminar esta propiedad")
  }

  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)

  if (deleteError) {
    console.error("[v0] Error deleting property:", deleteError)
    throw new Error(`Error deleting property: ${deleteError.message}`)
  }

  revalidatePath("/properties")
  revalidatePath("/dashboard")
}
