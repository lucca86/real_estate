"use server"

import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createProperty(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("No estás autenticado")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const propertyType = formData.get("propertyType") as string
  const transactionType = formData.get("transactionType") as string
  const status = formData.get("status") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
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
  const featured = formData.get("featured") === "on"
  const published = formData.get("published") === "on"

  if (!title || !description || !address || !city || !state || !area || !price) {
    throw new Error("Todos los campos requeridos deben ser completados")
  }

  const pricePerM2 = Number.parseFloat(price) / Number.parseFloat(area)

  await prisma.property.create({
    data: {
      title,
      description,
      propertyType: propertyType as any,
      transactionType: transactionType as any,
      status: status as any,
      address,
      city,
      state,
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
      featured,
      published,
      createdById: currentUser.id,
    },
  })

  revalidatePath("/properties")
  revalidatePath("/dashboard")
}

export async function updateProperty(propertyId: string, formData: FormData) {
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
  const propertyType = formData.get("propertyType") as string
  const transactionType = formData.get("transactionType") as string
  const status = formData.get("status") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
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
  const featured = formData.get("featured") === "on"
  const published = formData.get("published") === "on"

  const pricePerM2 = Number.parseFloat(price) / Number.parseFloat(area)

  await prisma.property.update({
    where: { id: propertyId },
    data: {
      title,
      description,
      propertyType: propertyType as any,
      transactionType: transactionType as any,
      status: status as any,
      address,
      city,
      state,
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
      featured,
      published,
    },
  })

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
