"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"
import crypto from "crypto"
import { serverLog } from "@/lib/server-log"

const ownerSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  ownerType: z.enum(["Propietario", "Apoderado", "Intermediario"]),
  realEstateAgency: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
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

export async function getOwners() {
  try {
    const supabase = await createAdminClient()

    const { data: owners, error } = await supabase
      .from("Owner")
      .select(`
        id, name, email, phone, secondaryPhone, address,
        cityId, provinceId, countryId,
        idNumber, taxId, notes, isActive, createdAt, updatedAt,
        city:City!Owner_cityId_fkey(id, name),
        province:Province!Owner_provinceId_fkey(id, name),
        country:Country!Owner_countryId_fkey(id, name)
      `)
      .order("createdAt", { ascending: false })

    if (error) throw error

    // Fetch property counts in a single query
    const { data: propCounts } = await supabase
      .from("Property")
      .select("ownerId")

    const countMap: Record<string, number> = {}
    for (const row of propCounts ?? []) {
      if (row.ownerId) countMap[row.ownerId] = (countMap[row.ownerId] ?? 0) + 1
    }

    const ownersWithCounts = (owners ?? []).map((owner) => {
      const city = Array.isArray(owner.city) ? owner.city[0] : owner.city
      const province = Array.isArray(owner.province) ? owner.province[0] : owner.province
      const country = Array.isArray(owner.country) ? owner.country[0] : owner.country

      return {
        id: String(owner.id),
        name: owner.name ?? "",
        email: owner.email ?? null,
        phone: owner.phone ?? "",
        secondaryPhone: owner.secondaryPhone ?? null,
        address: owner.address ?? null,
        cityId: owner.cityId ?? null,
        provinceId: owner.provinceId ?? null,
        countryId: owner.countryId ?? null,
        idNumber: owner.idNumber ?? null,
        taxId: owner.taxId ?? null,
        notes: owner.notes ?? null,
        isActive: owner.isActive ?? true,
        createdAt: owner.createdAt ?? null,
        updatedAt: owner.updatedAt ?? null,
        city: city ? { id: String(city.id), name: String(city.name) } : null,
        province: province ? { id: String(province.id), name: String(province.name) } : null,
        country: country ? { id: String(country.id), name: String(country.name) } : null,
        _count: { properties: countMap[owner.id] ?? 0 },
      }
    })

    return { success: true, data: ownersWithCounts }
  } catch (error) {
    serverLog.error("[getOwners]", error)
    return { success: false, error: "Error al obtener propietarios" }
  }
}

export async function getOwnerById(id: string) {
  try {
    const supabase = await createAdminClient()

    const { data: owner, error } = await supabase
      .from("Owner")
      .select(`
        *,
        city:City!Owner_cityId_fkey(name),
        province:Province!Owner_provinceId_fkey(name),
        country:Country!Owner_countryId_fkey(name)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    if (!owner) return { success: false, error: "Propietario no encontrado" }

    return { success: true, data: owner }
  } catch (error) {
    serverLog.error("[getOwnerById]", error)
    return { success: false, error: "Error al obtener propietario" }
  }
}

export async function createOwner(formData: FormData) {
  try {
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const ownerType = formData.get("ownerType") as string
    const realEstateAgency = formData.get("realEstateAgency") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const countryId = formData.get("countryId") as string
    const provinceId = formData.get("provinceId") as string
    const cityId = formData.get("cityId") as string

    if (!firstName || !lastName || !phone) {
      return { success: false, error: "Nombre, apellido y teléfono son requeridos" }
    }

    const ownerData = {
      id: crypto.randomUUID(),
      name: `${firstName} ${lastName}`,
      email: email || null,
      phone,
      secondaryPhone: (formData.get("secondaryPhone") as string) || null,
      address: (formData.get("address") as string) || null,
      cityId: cityId || null,
      provinceId: provinceId || null,
      countryId: countryId || null,
      idNumber: (formData.get("idNumber") as string) || null,
      taxId: (formData.get("taxId") as string) || null,
      notes: (formData.get("notes") as string) || null,
      isActive: true,
    }

    const supabase = await createAdminClient()
    const { data: owner, error } = await supabase.from("Owner").insert(ownerData).select().single()

    if (error) throw error

    revalidatePath("/owners")
    return { success: true, owner: { id: owner.id, name: owner.name } }
  } catch (error) {
    serverLog.error("[createOwner]", error)
    return { success: false, error: "Error al crear propietario" }
  }
}

export async function updateOwner(
  id: string,
  data: {
    firstName: string
    lastName: string
    ownerType: string
    realEstateAgency?: string
    email?: string
    phone: string
    secondaryPhone?: string
    address?: string
    cityId?: string
    provinceId?: string
    countryId?: string
    idNumber?: string
    taxId?: string
    notes?: string
    isActive: boolean
  },
) {
  try {
    const ownerData = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email || null,
      phone: data.phone,
      secondaryPhone: data.secondaryPhone || null,
      address: data.address || null,
      cityId: data.cityId || null,
      provinceId: data.provinceId || null,
      countryId: data.countryId || null,
      idNumber: data.idNumber || null,
      taxId: data.taxId || null,
      notes: data.notes || null,
      isActive: data.isActive,
    }

    const supabase = await createAdminClient()
    const { data: owner, error } = await supabase.from("Owner").update(ownerData).eq("id", id).select().single()

    if (error) throw error

    revalidatePath("/owners")
    revalidatePath(`/owners/${id}`)
    return { success: true, data: owner }
  } catch (error) {
    serverLog.error("[updateOwner]", error)
    return { success: false, error: "Error al actualizar propietario" }
  }
}

export async function deleteOwner(id: string) {
  try {
    const supabase = await createAdminClient()

    const { count } = await supabase.from("Property").select("*", { count: "exact", head: true }).eq("ownerId", id)

    if (count && count > 0) {
      const { error: updateError } = await supabase.from("Owner").update({ isActive: false }).eq("id", id)

      if (updateError) throw updateError

      revalidatePath("/owners")
      return {
        success: true,
        message: "El propietario tiene propiedades asignadas, se marcó como inactivo en lugar de eliminarlo",
      }
    }

    const { error } = await supabase.from("Owner").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/owners")
    return { success: true, message: "Propietario eliminado correctamente" }
  } catch (error) {
    serverLog.error("[deleteOwner]", error)
    return { success: false, error: "Error al eliminar propietario" }
  }
}
