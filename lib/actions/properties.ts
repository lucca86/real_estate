"use server"

import { prisma } from "@/lib/db"
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

  const newProperty = await prisma.property.create({
    data: {
      title,
      description,
      adrema: adrema || null,
      owner: {
        connect: { id: ownerId },
      },
      propertyType: propertyTypeId
        ? {
            connect: { id: propertyTypeId },
          }
        : undefined,
      transactionType: transactionType as any,
      status: status as any,
      rentalPeriod: rentalPeriod && rentalPeriod !== "" ? (rentalPeriod as any) : null,
      address,
      country: countryId ? { connect: { id: countryId } } : undefined,
      province: provinceId ? { connect: { id: provinceId } } : undefined,
      city: cityId ? { connect: { id: cityId } } : undefined,
      neighborhood: neighborhoodId ? { connect: { id: neighborhoodId } } : undefined,
      zipCode: zipCode || null,
      latitude: latitude ? Number.parseFloat(latitude) : null,
      longitude: longitude ? Number.parseFloat(longitude) : null,
      bedrooms: bedrooms ? Number.parseInt(bedrooms) : null,
      bathrooms: bathrooms ? Number.parseInt(bathrooms) : null,
      parkingSpaces: parkingSpaces ? Number.parseInt(parkingSpaces) : null,
      area: Number.parseFloat(area),
      lotSize: lotSize ? Number.parseFloat(lotSize) : null,
      yearBuilt: yearBuilt ? Number.parseInt(yearBuilt) : null,
      price: Number.parseFloat(price),
      pricePerM2,
      currency,
      rentalPrice: rentalPrice ? Number.parseFloat(rentalPrice) : null,
      features: features ? features.split(",").map((f) => f.trim()) : [],
      amenities: amenities ? amenities.split(",").map((a) => a.trim()) : [],
      images: images ? images.split(",").map((i) => i.trim()) : [],
      videos: videos ? videos.split(",").map((v) => v.trim()) : [],
      virtualTour: virtualTour || null,
      propertyLabel: propertyLabel && propertyLabel !== "NONE" ? (propertyLabel as any) : null,
      syncToWordPress,
      published,
      createdBy: {
        connect: { id: currentUser.id },
      },
    },
    include: {
      propertyType: true,
      country: true,
      province: true,
      city: true,
      neighborhood: true,
    },
  })

  if (syncToWordPress) {
    try {
      console.log("[v0] Syncing new property to WordPress:", newProperty.id)
      const wordpressId = await wordpressAPI.syncProperty({
        id: newProperty.id,
        title: newProperty.title,
        description: newProperty.description,
        propertyType: newProperty.propertyType?.name,
        transactionType: newProperty.transactionType,
        status: newProperty.status,
        address: newProperty.address,
        city: newProperty.city?.name,
        state: newProperty.province?.name,
        country: newProperty.country?.name,
        zipCode: newProperty.zipCode,
        latitude: newProperty.latitude,
        longitude: newProperty.longitude,
        bedrooms: newProperty.bedrooms,
        bathrooms: newProperty.bathrooms,
        parkingSpaces: newProperty.parkingSpaces,
        area: newProperty.area,
        lotSize: newProperty.lotSize,
        yearBuilt: newProperty.yearBuilt,
        price: newProperty.price,
        pricePerM2: newProperty.pricePerM2,
        features: newProperty.features,
        amenities: newProperty.amenities,
        images: newProperty.images,
        virtualTour: newProperty.virtualTour,
        propertyLabel: newProperty.propertyLabel,
        published: newProperty.published,
      })

      await prisma.property.update({
        where: { id: newProperty.id },
        data: { wordpressId },
      })

      console.log("[v0] Property synced successfully to WordPress with ID:", wordpressId)
    } catch (error) {
      console.error("[v0] Error syncing property to WordPress:", error)
    }
  }

  revalidatePath("/properties")
  revalidatePath("/dashboard")
}

export async function updateProperty(propertyId: string, formData: FormData) {
  console.log("[v0] updateProperty called for property:", propertyId)

  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  if (!property) {
    throw new Error("Propiedad no encontrada")
  }

  if (property.createdById !== currentUser.id && currentUser.role === "VENDEDOR") {
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

  console.log("[v0] Raw form data for propertyLabel:", {
    rawValue: formData.get("propertyLabel"),
    propertyLabel,
    isNONE: propertyLabel === "NONE",
    willBeNull: propertyLabel && propertyLabel !== "NONE" ? false : true,
  })

  console.log("[v0] Form data received:", {
    title,
    propertyLabel,
    syncToWordPress,
    published,
    status,
    transactionType,
  })

  const pricePerM2 = Number.parseFloat(price) / Number.parseFloat(area)

  const finalPropertyLabel = propertyLabel && propertyLabel !== "NONE" ? (propertyLabel as any) : null
  console.log("[v0] Final propertyLabel value to save:", finalPropertyLabel)

  const updatedProperty = await prisma.property.update({
    where: { id: propertyId },
    data: {
      title,
      description,
      adrema: adrema || null,
      owner: ownerId
        ? {
            connect: { id: ownerId },
          }
        : undefined,
      propertyType: propertyTypeId
        ? {
            connect: { id: propertyTypeId },
          }
        : {
            disconnect: true,
          },
      transactionType: transactionType as any,
      status: status as any,
      rentalPeriod: rentalPeriod && rentalPeriod !== "" ? (rentalPeriod as any) : null,
      address,
      country: countryId ? { connect: { id: countryId } } : { disconnect: true },
      province: provinceId ? { connect: { id: provinceId } } : { disconnect: true },
      city: cityId ? { connect: { id: cityId } } : { disconnect: true },
      neighborhood: neighborhoodId ? { connect: { id: neighborhoodId } } : { disconnect: true },
      zipCode: zipCode || null,
      latitude: latitude ? Number.parseFloat(latitude) : null,
      longitude: longitude ? Number.parseFloat(longitude) : null,
      bedrooms: bedrooms ? Number.parseInt(bedrooms) : null,
      bathrooms: bathrooms ? Number.parseInt(bathrooms) : null,
      parkingSpaces: parkingSpaces ? Number.parseInt(parkingSpaces) : null,
      area: Number.parseFloat(area),
      lotSize: lotSize ? Number.parseFloat(lotSize) : null,
      yearBuilt: yearBuilt ? Number.parseInt(yearBuilt) : null,
      price: Number.parseFloat(price),
      pricePerM2,
      currency,
      rentalPrice: rentalPrice ? Number.parseFloat(rentalPrice) : null,
      features: features ? features.split(",").map((f) => f.trim()) : [],
      amenities: amenities ? amenities.split(",").map((a) => a.trim()) : [],
      images: images ? images.split(",").map((i) => i.trim()) : [],
      videos: videos ? videos.split(",").map((v) => v.trim()) : [],
      virtualTour: virtualTour || null,
      propertyLabel: finalPropertyLabel,
      syncToWordPress,
      published,
    },
    include: {
      propertyType: true,
      country: true,
      province: true,
      city: true,
      neighborhood: true,
    },
  })

  console.log("[v0] Property updated in database:", {
    id: updatedProperty.id,
    title: updatedProperty.title,
    propertyLabel: updatedProperty.propertyLabel,
    syncToWordPress: updatedProperty.syncToWordPress,
    wordpressId: updatedProperty.wordpressId,
  })

  if (syncToWordPress) {
    try {
      console.log("[v0] Syncing updated property to WordPress:", updatedProperty.id)
      console.log("[v0] Property data being sent to WordPress:", {
        propertyLabel: updatedProperty.propertyLabel,
        title: updatedProperty.title,
        status: updatedProperty.status,
        published: updatedProperty.published,
        hasPropertyLabel: !!updatedProperty.propertyLabel,
        propertyLabelType: typeof updatedProperty.propertyLabel,
      })

      const wordpressId = await wordpressAPI.syncProperty({
        id: updatedProperty.id,
        wordpressId: updatedProperty.wordpressId,
        title: updatedProperty.title,
        description: updatedProperty.description,
        propertyType: updatedProperty.propertyType?.name,
        transactionType: updatedProperty.transactionType,
        status: updatedProperty.status,
        address: updatedProperty.address,
        city: updatedProperty.city?.name,
        state: updatedProperty.province?.name,
        country: updatedProperty.country?.name,
        zipCode: updatedProperty.zipCode,
        latitude: updatedProperty.latitude,
        longitude: updatedProperty.longitude,
        bedrooms: updatedProperty.bedrooms,
        bathrooms: updatedProperty.bathrooms,
        parkingSpaces: updatedProperty.parkingSpaces,
        area: updatedProperty.area,
        lotSize: updatedProperty.lotSize,
        yearBuilt: updatedProperty.yearBuilt,
        price: updatedProperty.price,
        pricePerM2: updatedProperty.pricePerM2,
        features: updatedProperty.features,
        amenities: updatedProperty.amenities,
        images: updatedProperty.images,
        virtualTour: updatedProperty.virtualTour,
        propertyLabel: updatedProperty.propertyLabel,
        published: updatedProperty.published,
      })

      if (!updatedProperty.wordpressId && wordpressId) {
        await prisma.property.update({
          where: { id: updatedProperty.id },
          data: { wordpressId },
        })
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

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  if (!property) {
    throw new Error("Propiedad no encontrada")
  }

  if (property.createdById !== currentUser.id && currentUser.role !== "ADMIN") {
    throw new Error("No tienes permisos para eliminar esta propiedad")
  }

  await prisma.property.delete({
    where: { id: propertyId },
  })

  revalidatePath("/properties")
  revalidatePath("/dashboard")
}
