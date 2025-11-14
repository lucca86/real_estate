"use server"

import { revalidatePath } from "next/cache"
import { db, getSqlClient } from "@/lib/db"
import { z } from "zod"
import { TransactionType } from "@prisma/client"

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  cityId: z.string().optional(),
  provinceId: z.string().optional(),
  countryId: z.string().optional(),
  occupation: z.string().optional(),
  budget: z.number().optional(),
  preferredPropertyTypeId: z.string().optional(),
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
        city: { select: { name: true } },
        province: { select: { name: true } },
        country: { select: { name: true } },
        _count: {
          select: { appointments: true },
        },
      },
    })
    return { success: true, data: clients }
  } catch (error) {
    console.error("[getClients] Prisma error, trying direct SQL:", error)
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const sql = getSqlClient()
        const result = await sql`
          SELECT 
            cl.*,
            c.name as city_name,
            p.name as province_name,
            co.name as country_name,
            COUNT(a.id)::int as appointments_count
          FROM "Client" cl
          LEFT JOIN "City" c ON cl."cityId" = c.id
          LEFT JOIN "Province" p ON cl."provinceId" = p.id
          LEFT JOIN "Country" co ON cl."countryId" = co.id
          LEFT JOIN "Appointment" a ON a."clientId" = cl.id
          GROUP BY cl.id, c.name, p.name, co.name
          ORDER BY cl."createdAt" DESC
        `
        
        const clients = result.map((row: any) => ({
          ...row,
          city: row.city_name ? { name: row.city_name } : null,
          province: row.province_name ? { name: row.province_name } : null,
          country: row.country_name ? { name: row.country_name } : null,
          _count: { appointments: row.appointments_count || 0 }
        }))
        
        console.log("[getClients] Successfully fetched via direct SQL")
        return { success: true, data: clients }
      } catch (sqlError) {
        console.error("[getClients] SQL fallback error:", sqlError)
        return { success: false, error: "Error al obtener clientes" }
      }
    }
    
    return { success: false, error: "Error al obtener clientes" }
  }
}

export async function getClientById(id: string) {
  try {
    const client = await db.client.findUnique({
      where: { id },
      include: {
        city: { select: { name: true } },
        province: { select: { name: true } },
        country: { select: { name: true } },
        preferredPropertyType: { select: { name: true } },
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
    console.error("[getClientById] Prisma error, trying direct SQL:", error)
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const sql = getSqlClient()
        const clientResult = await sql`
          SELECT 
            cl.*,
            c.name as city_name,
            p.name as province_name,
            co.name as country_name,
            pt.name as preferred_property_type_name
          FROM "Client" cl
          LEFT JOIN "City" c ON cl."cityId" = c.id
          LEFT JOIN "Province" p ON cl."provinceId" = p.id
          LEFT JOIN "Country" co ON cl."countryId" = co.id
          LEFT JOIN "PropertyType" pt ON cl."preferredPropertyTypeId" = pt.id
          WHERE cl.id = ${id}
        `
        
        if (clientResult.length === 0) {
          return { success: false, error: "Cliente no encontrado" }
        }
        
        const appointmentsResult = await sql`
          SELECT 
            a.*,
            jsonb_build_object(
              'id', pr.id,
              'title', pr.title,
              'address', pr.address,
              'images', pr.images
            ) as property,
            jsonb_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email
            ) as agent
          FROM "Appointment" a
          LEFT JOIN "Property" pr ON a."propertyId" = pr.id
          LEFT JOIN "User" u ON a."agentId" = u.id
          WHERE a."clientId" = ${id}
          ORDER BY a."scheduledAt" DESC
        `
        
        const client = {
          ...clientResult[0],
          city: clientResult[0].city_name ? { name: clientResult[0].city_name } : null,
          province: clientResult[0].province_name ? { name: clientResult[0].province_name } : null,
          country: clientResult[0].country_name ? { name: clientResult[0].country_name } : null,
          preferredPropertyType: clientResult[0].preferred_property_type_name ? { name: clientResult[0].preferred_property_type_name } : null,
          appointments: appointmentsResult
        }
        
        console.log("[getClientById] Successfully fetched via direct SQL")
        return { success: true, data: client }
      } catch (sqlError) {
        console.error("[getClientById] SQL fallback error:", sqlError)
        return { success: false, error: "Error al obtener cliente" }
      }
    }
    
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
