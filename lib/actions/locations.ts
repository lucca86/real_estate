"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Country actions
export async function createCountry(formData: FormData) {
  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !code) {
    throw new Error("Nombre y código son requeridos")
  }

  try {
    const country = await prisma.country.create({
      data: {
        name,
        code: code.toUpperCase(),
        isActive,
      },
    })

    revalidatePath("/locations")
    return country
  } catch (error: any) {
    console.error("[v0] Error creating country:", error)
    throw new Error(error.message || "Error al crear el país")
  }
}

export async function updateCountry(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !code) {
    throw new Error("Nombre y código son requeridos")
  }

  try {
    const country = await prisma.country.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
        isActive,
      },
    })

    revalidatePath("/locations")
    return country
  } catch (error: any) {
    console.error("[v0] Error updating country:", error)
    throw new Error(error.message || "Error al actualizar el país")
  }
}

// Province actions
export async function createProvince(formData: FormData) {
  const name = formData.get("name") as string
  const countryId = formData.get("countryId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !countryId) {
    throw new Error("Nombre y país son requeridos")
  }

  try {
    const province = await prisma.province.create({
      data: {
        name,
        countryId,
        isActive,
      },
    })

    revalidatePath("/locations")
    return province
  } catch (error: any) {
    console.error("[v0] Error creating province:", error)
    throw new Error(error.message || "Error al crear la provincia")
  }
}

export async function updateProvince(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const countryId = formData.get("countryId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !countryId) {
    throw new Error("Nombre y país son requeridos")
  }

  try {
    const province = await prisma.province.update({
      where: { id },
      data: {
        name,
        countryId,
        isActive,
      },
    })

    revalidatePath("/locations")
    return province
  } catch (error: any) {
    console.error("[v0] Error updating province:", error)
    throw new Error(error.message || "Error al actualizar la provincia")
  }
}

// City actions
export async function createCity(formData: FormData) {
  const name = formData.get("name") as string
  const provinceId = formData.get("provinceId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !provinceId) {
    throw new Error("Nombre y provincia son requeridos")
  }

  try {
    const city = await prisma.city.create({
      data: {
        name,
        provinceId,
        isActive,
      },
    })

    revalidatePath("/locations")
    return city
  } catch (error: any) {
    console.error("[v0] Error creating city:", error)
    throw new Error(error.message || "Error al crear la ciudad")
  }
}

export async function updateCity(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const provinceId = formData.get("provinceId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !provinceId) {
    throw new Error("Nombre y provincia son requeridos")
  }

  try {
    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        provinceId,
        isActive,
      },
    })

    revalidatePath("/locations")
    return city
  } catch (error: any) {
    console.error("[v0] Error updating city:", error)
    throw new Error(error.message || "Error al actualizar la ciudad")
  }
}

// Neighborhood actions
export async function createNeighborhood(formData: FormData) {
  const name = formData.get("name") as string
  const cityId = formData.get("cityId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !cityId) {
    throw new Error("Nombre y ciudad son requeridos")
  }

  try {
    const neighborhood = await prisma.neighborhood.create({
      data: {
        name,
        cityId,
        isActive,
      },
    })

    revalidatePath("/locations")
    return neighborhood
  } catch (error: any) {
    console.error("[v0] Error creating neighborhood:", error)
    throw new Error(error.message || "Error al crear el barrio")
  }
}

export async function updateNeighborhood(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const cityId = formData.get("cityId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !cityId) {
    throw new Error("Nombre y ciudad son requeridos")
  }

  try {
    const neighborhood = await prisma.neighborhood.update({
      where: { id },
      data: {
        name,
        cityId,
        isActive,
      },
    })

    revalidatePath("/locations")
    return neighborhood
  } catch (error: any) {
    console.error("[v0] Error updating neighborhood:", error)
    throw new Error(error.message || "Error al actualizar el barrio")
  }
}

// Delete action for all location types
export async function deleteLocation(type: "country" | "province" | "city" | "neighborhood", id: string) {
  try {
    switch (type) {
      case "country":
        await prisma.country.delete({ where: { id } })
        break
      case "province":
        await prisma.province.delete({ where: { id } })
        break
      case "city":
        await prisma.city.delete({ where: { id } })
        break
      case "neighborhood":
        await prisma.neighborhood.delete({ where: { id } })
        break
    }

    revalidatePath("/locations")
  } catch (error: any) {
    console.error(`[v0] Error deleting ${type}:`, error)
    throw new Error(error.message || `Error al eliminar el ${type}`)
  }
}

// Get functions for cascading location selects
export async function getCountries() {
  try {
    const countries = await prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    })
    return countries
  } catch (error: any) {
    console.error("[v0] Error fetching countries:", error)
    return []
  }
}

export async function getProvinces(countryId: string) {
  try {
    const provinces = await prisma.province.findMany({
      where: {
        countryId,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    })
    return provinces
  } catch (error: any) {
    console.error("[v0] Error fetching provinces:", error)
    return []
  }
}

export async function getCities(provinceId: string) {
  try {
    const cities = await prisma.city.findMany({
      where: {
        provinceId,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    })
    return cities
  } catch (error: any) {
    console.error("[v0] Error fetching cities:", error)
    return []
  }
}

export async function getNeighborhoods(cityId: string) {
  try {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        cityId,
        isActive: true,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    })
    return neighborhoods
  } catch (error: any) {
    console.error("[v0] Error fetching neighborhoods:", error)
    return []
  }
}
