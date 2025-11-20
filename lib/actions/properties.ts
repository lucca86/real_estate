"use server"

import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { wordpressAPI } from "@/lib/wordpress"
import crypto from "crypto"

export async function createProperty(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
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
  const latitude = formData.get("latitude") as string
  const longitude = formData.get("longitude") as string
  const bedrooms = formData.get("bedrooms") as string
  const bathrooms = formData.get("bathrooms") as string
  const parkingSpaces = formData.get("parkingSpaces") as string
  const area = formData.get("area") as string
  const yearBuilt = formData.get("yearBuilt") as string
  const price = formData.get("price") as string
  const currency = formData.get("currency") as string
  const rentalPrice = formData.get("rentalPrice") as string
  const amenities = formData.get("amenities") as string
  const images = formData.get("images") as string
  const isFeatured = formData.get("isFeatured") === "on"
  const lotSize = formData.get("lotSize") as string
  const propertyLabel = formData.get("propertyLabel") as string
  const adrema = formData.get("adrema") as string
  const features = formData.get("features") as string
  const videos = formData.get("videos") as string
  const virtualTour = formData.get("virtualTour") as string
  const published = formData.get("published") === "on"
  const syncToWordPress = formData.get("syncToWordPress") === "on"

  if (!title || !description || !address || !countryId || !provinceId || !cityId || !area || !price || !ownerId) {
    throw new Error("Todos los campos requeridos deben ser completados")
  }

  const supabase = await createServerClient()

  const pricePerM2 = price && area ? Number.parseFloat(price) / Number.parseFloat(area) : null

  const { data: newProperty, error } = await supabase
    .from("properties")
    .insert({
      id: crypto.randomUUID(),
      title,
      description,
      owner_id: ownerId,
      property_type_id: propertyTypeId || null,
      status,
      transaction_type: transactionType || null,
      rental_period: rentalPeriod || null,
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
      amenities: amenities ? amenities.split(",").map((a) => a.trim()) : [],
      images: images ? images.split(",").map((i) => i.trim()) : [],
      is_featured: isFeatured,
      property_label: propertyLabel && propertyLabel !== "NONE" ? propertyLabel : null,
      adrema: adrema || null,
      features: features ? features.split(",").map((f) => f.trim()) : [],
      videos: videos ? videos.split(",").map((v) => v.trim()) : [],
      virtual_tour: virtualTour || null,
      published: published,
      sync_to_wordpress: syncToWordPress,
      is_active: true,
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

      const { data: propertyWithRelations } = await supabase
        .from("properties")
        .select(`
          *,
          property_type:property_types!property_type_id(name),
          city:cities!city_id(name),
          province:provinces!province_id(name),
          country:countries!country_id(name)
        `)
        .eq("id", newProperty.id)
        .single()

      const wordpressId = await wordpressAPI.syncProperty({
        id: newProperty.id,
        title: newProperty.title,
        description: newProperty.description,
        propertyType: propertyWithRelations?.property_type?.name || null,
        transactionType: newProperty.transaction_type,
        status: newProperty.status,
        address: newProperty.address,
        city: propertyWithRelations?.city?.name || null,
        state: propertyWithRelations?.province?.name || null,
        country: propertyWithRelations?.country?.name || null,
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
        features: newProperty.features || [],
        amenities: newProperty.amenities,
        images: newProperty.images,
        virtualTour: newProperty.virtual_tour,
        propertyLabel: newProperty.property_label,
        published: newProperty.published,
      })

      await supabase.from("properties").update({ wordpress_id: wordpressId }).eq("id", newProperty.id)

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
  const latitude = formData.get("latitude") as string
  const longitude = formData.get("longitude") as string
  const bedrooms = formData.get("bedrooms") as string
  const bathrooms = formData.get("bathrooms") as string
  const parkingSpaces = formData.get("parkingSpaces") as string
  const area = formData.get("area") as string
  const yearBuilt = formData.get("yearBuilt") as string
  const price = formData.get("price") as string
  const currency = formData.get("currency") as string
  const rentalPrice = formData.get("rentalPrice") as string
  const amenities = formData.get("amenities") as string
  const images = formData.get("images") as string
  const isFeatured = formData.get("isFeatured") === "on"
  const lotSize = formData.get("lotSize") as string
  const propertyLabel = formData.get("propertyLabel") as string
  const adrema = formData.get("adrema") as string
  const features = formData.get("features") as string
  const videos = formData.get("videos") as string
  const virtualTour = formData.get("virtualTour") as string
  const published = formData.get("published") === "on"
  const syncToWordPress = formData.get("syncToWordPress") === "on"

  const pricePerM2 = price && area ? Number.parseFloat(price) / Number.parseFloat(area) : null

  const { data: updatedProperty, error: updateError } = await supabase
    .from("properties")
    .update({
      title,
      description,
      owner_id: ownerId,
      property_type_id: propertyTypeId || null,
      status,
      transaction_type: transactionType || null,
      rental_period: rentalPeriod || null,
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
      amenities: amenities ? amenities.split(",").map((a) => a.trim()) : [],
      images: images ? images.split(",").map((i) => i.trim()) : [],
      is_featured: isFeatured,
      property_label: propertyLabel && propertyLabel !== "NONE" ? propertyLabel : null,
      adrema: adrema || null,
      features: features ? features.split(",").map((f) => f.trim()) : [],
      videos: videos ? videos.split(",").map((v) => v.trim()) : [],
      virtual_tour: virtualTour || null,
      published: published,
      sync_to_wordpress: syncToWordPress,
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

      const { data: propertyWithRelations } = await supabase
        .from("properties")
        .select(`
          *,
          property_type:property_types!property_type_id(name),
          city:cities!city_id(name),
          province:provinces!province_id(name),
          country:countries!country_id(name)
        `)
        .eq("id", updatedProperty.id)
        .single()

      const wordpressId = await wordpressAPI.syncProperty({
        id: updatedProperty.id,
        wordpressId: updatedProperty.wordpress_id,
        title: updatedProperty.title,
        description: updatedProperty.description,
        propertyType: propertyWithRelations?.property_type?.name || null,
        transactionType: updatedProperty.transaction_type,
        status: updatedProperty.status,
        address: updatedProperty.address,
        city: propertyWithRelations?.city?.name || null,
        state: propertyWithRelations?.province?.name || null,
        country: propertyWithRelations?.country?.name || null,
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
        features: updatedProperty.features || [],
        amenities: updatedProperty.amenities,
        images: updatedProperty.images,
        virtualTour: updatedProperty.virtual_tour,
        propertyLabel: updatedProperty.property_label,
        published: updatedProperty.published,
      })

      if (!updatedProperty.wordpress_id && wordpressId) {
        await supabase.from("properties").update({ wordpress_id: wordpressId }).eq("id", updatedProperty.id)
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

  if (currentUser.role !== "ADMIN") {
    throw new Error("No tienes permisos para eliminar esta propiedad")
  }

  const { error: deleteError } = await supabase.from("properties").delete().eq("id", propertyId)

  if (deleteError) {
    console.error("[v0] Error deleting property:", deleteError)
    throw new Error(`Error deleting property: ${deleteError.message}`)
  }

  revalidatePath("/properties")
  revalidatePath("/dashboard")
}

export async function getPropertyById(id: string) {
  const supabase = await createServerClient()

  const { data: property, error } = await supabase
    .from("properties")
    .select(`
      *,
      owner:owners!owner_id(id, name, email),
      city:cities!city_id(id, name),
      province:provinces!province_id(id, name),
      country:countries!country_id(id, name),
      neighborhood:neighborhoods!neighborhood_id(id, name),
      property_type:property_types!property_type_id(id, name)
    `)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error fetching property:", error)
    return null
  }

  if (!property) {
    console.error("[v0] Property not found with id:", id)
    return null
  }

  return property
}
