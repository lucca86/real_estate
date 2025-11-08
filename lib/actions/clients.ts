"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { z } from "zod"
import { PropertyType, TransactionType } from "@prisma/client"

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("República Dominicana"),
  occupation: z.string().optional(),
  budget: z.number().optional(),
  preferredPropertyType: z.nativeEnum(PropertyType).optional(),
  preferredTransactionType: z.nativeEnum(TransactionType).optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function getClients() {
  try {
    const clients = await db.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    })
    return { success: true, data: clients }
  } catch (error) {
    console.error("[getClients] Error:", error)
    return { success: false, error: "Error al obtener clientes" }
  }
}

export async function getClientById(id: string) {
  try {
    const client = await db.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                images: true,
              },
            },
            agent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { scheduledAt: "desc" },
        },
      },
    })

    if (!client) {
      return { success: false, error: "Cliente no encontrado" }
    }

    return { success: true, data: client }
  } catch (error) {
    console.error("[getClientById] Error:", error)
    return { success: false, error: "Error al obtener cliente" }
  }
}

export async function createClient(data: z.infer<typeof clientSchema>) {
  try {
    const validated = clientSchema.parse(data)

    const client = await db.client.create({
      data: validated,
    })

    revalidatePath("/clients")
    return { success: true, data: client }
  } catch (error) {
    console.error("[createClient] Error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Error al crear cliente" }
  }
}

export async function updateClient(id: string, data: z.infer<typeof clientSchema>) {
  try {
    const validated = clientSchema.parse(data)

    const client = await db.client.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/clients")
    revalidatePath(`/clients/${id}`)
    return { success: true, data: client }
  } catch (error) {
    console.error("[updateClient] Error:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Error al actualizar cliente" }
  }
}

export async function deleteClient(id: string) {
  try {
    await db.client.delete({
      where: { id },
    })

    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error("[deleteClient] Error:", error)
    return { success: false, error: "Error al eliminar cliente" }
  }
}
