"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { z } from "zod"

const ownerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  cityId: z.string().optional(),
  provinceId: z.string().optional(),
  countryId: z.string().optional(),
  idNumber: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

const quickOwnerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
})

export async function getOwners() {
  try {
    const owners = await db.owner.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { name: true } },
        province: { select: { name: true } },
        country: { select: { name: true } },
        _count: {
          select: { properties: true },
        },
      },
    })
    return { success: true, data: owners }
  } catch (error) {
    console.error("[getOwners] Error:", error)
    return { success: false, error: "Error al obtener propietarios" }
  }
}

export async function getOwnerById(id: string) {
  try {
    const owner = await db.owner.findUnique({
      where: { id },
      include: {
        city: { select: { name: true } },
        province: { select: { name: true } },
        country: { select: { name: true } },
        properties: {
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            images: true,
          },
        },
      },
    })

    if (!owner) {
      return { success: false, error: "Propietario no encontrado" }
    }

    return { success: true, data: owner }
  } catch (error) {
    console.error("[getOwnerById] Error:", error)
    return { success: false, error: "Error al obtener propietario" }
  }
}

export async function createOwner(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      secondaryPhone: formData.get("secondaryPhone") as string | undefined,
      address: formData.get("address") as string | undefined,
      cityId: formData.get("cityId") as string | undefined,
      provinceId: formData.get("provinceId") as string | undefined,
      countryId: formData.get("countryId") as string | undefined,
      idNumber: formData.get("idNumber") as string | undefined,
      taxId: formData.get("taxId") as string | undefined,
      notes: formData.get("notes") as string | undefined,
      isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    }

    const isQuickCreate = !data.secondaryPhone && !data.address && !data.cityId
    const validated = isQuickCreate ? quickOwnerSchema.parse(data) : ownerSchema.parse(data)

    const owner = await db.owner.create({
      data: validated,
    })

    revalidatePath("/owners")
    return { success: true, owner: { id: owner.id, name: owner.name } }
  } catch (error) {
    console.error("[createOwner] Error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Error al crear propietario" }
  }
}

export async function updateOwner(id: string, data: z.infer<typeof ownerSchema>) {
  try {
    const validated = ownerSchema.parse(data)

    const owner = await db.owner.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/owners")
    revalidatePath(`/owners/${id}`)
    return { success: true, data: owner }
  } catch (error) {
    console.error("[updateOwner] Error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Error al actualizar propietario" }
  }
}

export async function deleteOwner(id: string) {
  try {
    await db.owner.delete({
      where: { id },
    })

    revalidatePath("/owners")
    return { success: true }
  } catch (error) {
    console.error("[deleteOwner] Error:", error)
    return { success: false, error: "Error al eliminar propietario" }
  }
}
