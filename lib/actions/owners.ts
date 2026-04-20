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
      .from("owners")
      .select(`
        id, name, email, phone, secondary_phone, address,
        city_id, province_id, country_id,
        id_number, tax_id, notes, is_active, created_at, updated_at,
        first_name, last_name, owner_type, real_estate_agency,
        city:cities!owners_city_id_fkey(id, name),
        province:provinces!owners_province_id_fkey(id, name),
        country:countries!owners_country_id_fkey(id, name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const { data: propCounts } = await supabase
      .from("properties")
      .select("owner_id")

    const countMap: Record<string, number> = {}
    for (const row of propCounts ?? []) {
      if (row.owner_id) countMap[row.owner_id] = (countMap[row.owner_id] ?? 0) + 1
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
        secondaryPhone: owner.secondary_phone ?? null,
        address: owner.address ?? null,
        cityId: owner.city_id ?? null,
        provinceId: owner.province_id ?? null,
        countryId: owner.country_id ?? null,
        idNumber: owner.id_number ?? null,
        taxId: owner.tax_id ?? null,
        notes: owner.notes ?? null,
        isActive: owner.is_active ?? true,
        createdAt: owner.created_at ?? null,
        updatedAt: owner.updated_at ?? null,
        firstName: owner.first_name ?? null,
        lastName: owner.last_name ?? null,
        ownerType: owner.owner_type ?? null,
        realEstateAgency: owner.real_estate_agency ?? null,
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
      .from("owners")
      .select(`
        *,
        city:cities!owners_city_id_fkey(name),
        province:provinces!owners_province_id_fkey(name),
        country:countries!owners_country_id_fkey(name)
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
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const countryId = formData.get("countryId") as string
    const provinceId = formData.get("provinceId") as string
    const cityId = formData.get("cityId") as string

    if (!firstName || !lastName || !phone) {
      return { success: false, error: "Nombre, apellido y teléfono son requeridos" }
    }

    const ownerData = {
      id: crypto.randomUUID(),
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      owner_type: (formData.get("ownerType") as string) || "Propietario",
      real_estate_agency: (formData.get("realEstateAgency") as string) || null,
      email: email || null,
      phone,
      secondary_phone: (formData.get("secondaryPhone") as string) || null,
      address: (formData.get("address") as string) || null,
      city_id: cityId || null,
      province_id: provinceId || null,
      country_id: countryId || null,
      id_number: (formData.get("idNumber") as string) || null,
      tax_id: (formData.get("taxId") as string) || null,
      notes: (formData.get("notes") as string) || null,
      is_active: true,
    }

    const supabase = await createAdminClient()
    const { data: owner, error } = await supabase.from("owners").insert(ownerData).select().single()

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
      first_name: data.firstName,
      last_name: data.lastName,
      owner_type: data.ownerType,
      real_estate_agency: data.realEstateAgency || null,
      email: data.email || null,
      phone: data.phone,
      secondary_phone: data.secondaryPhone || null,
      address: data.address || null,
      city_id: data.cityId || null,
      province_id: data.provinceId || null,
      country_id: data.countryId || null,
      id_number: data.idNumber || null,
      tax_id: data.taxId || null,
      notes: data.notes || null,
      is_active: data.isActive,
    }

    const supabase = await createAdminClient()
    const { data: owner, error } = await supabase.from("owners").update(ownerData).eq("id", id).select().single()

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

    const { count } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", id)

    if (count && count > 0) {
      const { error: updateError } = await supabase.from("owners").update({ is_active: false }).eq("id", id)

      if (updateError) throw updateError

      revalidatePath("/owners")
      return {
        success: true,
        message: "El propietario tiene propiedades asignadas, se marcó como inactivo en lugar de eliminarlo",
      }
    }

    const { error } = await supabase.from("owners").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/owners")
    return { success: true, message: "Propietario eliminado correctamente" }
  } catch (error) {
    serverLog.error("[deleteOwner]", error)
    return { success: false, error: "Error al eliminar propietario" }
  }
}
