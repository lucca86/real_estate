"use server"

import { prisma } from "@/lib/db"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { wordpressAPI } from "@/lib/wordpress"
import { revalidatePath } from "next/cache"

export async function syncPropertyToWordPress(propertyId: string) {
  const currentUser = await getCurrentUser()

  if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
    throw new Error("No tienes permisos para sincronizar propiedades")
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      propertyType: true,
      country: true,
      province: true,
      city: true,
      neighborhood: true,
      owner: true,
    },
  })

  if (!property) {
    throw new Error("Propiedad no encontrada")
  }

  console.log("[v0] Syncing property from sync button:", {
    id: property.id,
    title: property.title,
    propertyLabel: property.propertyLabel,
    hasPropertyLabel: !!property.propertyLabel,
    propertyLabelType: typeof property.propertyLabel,
    allFields: {
      status: property.status,
      transactionType: property.transactionType,
      published: property.published,
      syncToWordPress: property.syncToWordPress,
    },
  })

  try {
    const wordpressId = await wordpressAPI.syncProperty({
      id: property.id,
      wordpressId: property.wordpressId,
      title: property.title,
      description: property.description,
      propertyType: property.propertyType?.name,
      transactionType: property.transactionType,
      status: property.status,
      address: property.address,
      city: property.city?.name,
      state: property.province?.name,
      country: property.country?.name,
      zipCode: property.zipCode,
      latitude: property.latitude,
      longitude: property.longitude,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      area: property.area,
      lotSize: property.lotSize,
      yearBuilt: property.yearBuilt,
      price: property.price,
      pricePerM2: property.pricePerM2,
      features: property.features,
      amenities: property.amenities,
      images: property.images,
      virtualTour: property.virtualTour,
      propertyLabel: property.propertyLabel,
      published: property.published,
    })

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        wordpressId,
        syncedAt: new Date(),
      },
    })

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

  const properties = await prisma.property.findMany({
    where: { published: true },
    include: {
      propertyType: true,
      country: true,
      province: true,
      city: true,
      neighborhood: true,
      owner: true,
    },
  })

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const property of properties) {
    try {
      const wordpressId = await wordpressAPI.syncProperty({
        id: property.id,
        wordpressId: property.wordpressId,
        title: property.title,
        description: property.description,
        propertyType: property.propertyType?.name,
        transactionType: property.transactionType,
        status: property.status,
        address: property.address,
        city: property.city?.name,
        state: property.province?.name,
        country: property.country?.name,
        zipCode: property.zipCode,
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        area: property.area,
        lotSize: property.lotSize,
        yearBuilt: property.yearBuilt,
        price: property.price,
        pricePerM2: property.pricePerM2,
        features: property.features,
        amenities: property.amenities,
        images: property.images,
        virtualTour: property.virtualTour,
        propertyLabel: property.propertyLabel,
        published: property.published,
      })

      await prisma.property.update({
        where: { id: property.id },
        data: {
          wordpressId,
          syncedAt: new Date(),
        },
      })

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

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  })

  if (!property || !property.wordpressId) {
    throw new Error("Propiedad no encontrada o no sincronizada")
  }

  try {
    await wordpressAPI.deleteProperty(property.wordpressId)

    await prisma.property.update({
      where: { id: propertyId },
      data: {
        wordpressId: null,
        syncedAt: null,
      },
    })

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
