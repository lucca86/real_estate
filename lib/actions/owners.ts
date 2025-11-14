"use server"

import { revalidatePath } from "next/cache"
import { db, getSqlClient } from "@/lib/db"
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
    console.error("[getOwners] Prisma error, trying direct SQL:", error)
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const sql = getSqlClient()
        const result = await sql`
          SELECT 
            o.*,
            c.name as city_name,
            p.name as province_name,
            co.name as country_name,
            COUNT(pr.id)::int as properties_count
          FROM "Owner" o
          LEFT JOIN "City" c ON o."cityId" = c.id
          LEFT JOIN "Province" p ON o."provinceId" = p.id
          LEFT JOIN "Country" co ON o."countryId" = co.id
          LEFT JOIN "Property" pr ON pr."ownerId" = o.id
          GROUP BY o.id, c.name, p.name, co.name
          ORDER BY o."createdAt" DESC
        `
        
        const owners = result.map((row: any) => ({
          ...row,
          city: row.city_name ? { name: row.city_name } : null,
          province: row.province_name ? { name: row.province_name } : null,
          country: row.country_name ? { name: row.country_name } : null,
          _count: { properties: row.properties_count || 0 }
        }))
        
        console.log("[getOwners] Successfully fetched via direct SQL")
        return { success: true, data: owners }
      } catch (sqlError) {
        console.error("[getOwners] SQL fallback error:", sqlError)
        return { success: false, error: "Error al obtener propietarios" }
      }
    }
    
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
    console.error("[getOwnerById] Prisma error, trying direct SQL:", error)
    
    if (process.env.NODE_ENV === 'production') {
      try {
        const sql = getSqlClient()
        const ownerResult = await sql`
          SELECT 
            o.*,
            c.name as city_name,
            p.name as province_name,
            co.name as country_name
          FROM "Owner" o
          LEFT JOIN "City" c ON o."cityId" = c.id
          LEFT JOIN "Province" p ON o."provinceId" = p.id
          LEFT JOIN "Country" co ON o."countryId" = co.id
          WHERE o.id = ${id}
        `
        
        if (ownerResult.length === 0) {
          return { success: false, error: "Propietario no encontrado" }
        }
        
        const propertiesResult = await sql`
          SELECT id, title, status, price, images
          FROM "Property"
          WHERE "ownerId" = ${id}
        `
        
        const owner = {
          ...ownerResult[0],
          city: ownerResult[0].city_name ? { name: ownerResult[0].city_name } : null,
          province: ownerResult[0].province_name ? { name: ownerResult[0].province_name } : null,
          country: ownerResult[0].country_name ? { name: ownerResult[0].country_name } : null,
          properties: propertiesResult
        }
        
        console.log("[getOwnerById] Successfully fetched via direct SQL")
        return { success: true, data: owner }
      } catch (sqlError) {
        console.error("[getOwnerById] SQL fallback error:", sqlError)
        return { success: false, error: "Error al obtener propietario" }
      }
    }
    
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
