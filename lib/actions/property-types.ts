"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { z } from "zod"
import type { PropertyType } from "@prisma/client"

const propertyTypeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

type PropertyTypeWithCount = PropertyType & {
  _count: {
    properties: number
  }
}

export async function getPropertyTypes(): Promise<PropertyTypeWithCount[]> {
  try {
    const propertyTypes = await db.propertyType.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { properties: true },
        },
      },
    })
    return propertyTypes
  } catch (error) {
    console.error("[v0] Error fetching property types:", error)
    throw new Error("Error al obtener los tipos de propiedad")
  }
}

export async function getActivePropertyTypes(): Promise<PropertyType[]> {
  try {
    const propertyTypes = await db.propertyType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
    return propertyTypes
  } catch (error) {
    console.error("[v0] Error fetching active property types:", error)
    throw new Error("Error al obtener los tipos de propiedad activos")
  }
}

export async function getPropertyTypeById(id: string): Promise<PropertyTypeWithCount | null> {
  try {
    const propertyType = await db.propertyType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { properties: true },
        },
      },
    })
    return propertyType
  } catch (error) {
    console.error("[v0] Error fetching property type:", error)
    throw new Error("Error al obtener el tipo de propiedad")
  }
}

export async function createPropertyType(formData: FormData): Promise<PropertyType> {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      isActive: formData.get("isActive") === "on",
    }

    const validated = propertyTypeSchema.parse(data)

    const propertyType = await db.propertyType.create({
      data: validated,
    })

    revalidatePath("/property-types")
    return propertyType
  } catch (error) {
    console.error("[v0] Error creating property type:", error)
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw new Error("Error al crear el tipo de propiedad")
  }
}

export async function updatePropertyType(id: string, formData: FormData): Promise<PropertyType> {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      isActive: formData.get("isActive") === "on",
    }

    const validated = propertyTypeSchema.parse(data)

    const propertyType = await db.propertyType.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/property-types")
    revalidatePath(`/property-types/${id}/edit`)
    return propertyType
  } catch (error) {
    console.error("[v0] Error updating property type:", error)
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw new Error("Error al actualizar el tipo de propiedad")
  }
}

export async function deletePropertyType(id: string): Promise<void> {
  try {
    // Check if property type has associated properties
    const propertyType = await db.propertyType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { properties: true },
        },
      },
    })

    if (!propertyType) {
      throw new Error("Tipo de propiedad no encontrado")
    }

    if (propertyType._count.properties > 0) {
      throw new Error(
        `No se puede eliminar este tipo de propiedad porque tiene ${propertyType._count.properties} propiedad(es) asociada(s)`,
      )
    }

    await db.propertyType.delete({
      where: { id },
    })

    revalidatePath("/property-types")
  } catch (error) {
    console.error("[v0] Error deleting property type:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Error al eliminar el tipo de propiedad")
  }
}
