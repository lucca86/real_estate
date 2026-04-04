"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
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
  secondary_phone: z.string().optional(),
  address: z.string().optional(),
  city_id: z.string().optional(),
  province_id: z.string().optional(),
  country_id: z.string().optional(),
  id_number: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
})

const quickOwnerSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es requerido"),
})

export async function getOwners() {
  try {
    const supabase = await createServerClient()

    const { data: owners, error } = await supabase
      .from("owners")
      .select(`
        *,
        city:cities(id, name),
        province:provinces(id, name),
        country:countries(id, name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get properties count for each owner
    const ownersWithCounts = await Promise.all(
      (owners || []).map(async (owner) => {
        const { count } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", owner.id)

        const city = Array.isArray(owner.city) ? owner.city[0] : owner.city
        const province = Array.isArray(owner.province) ? owner.province[0] : owner.province
        const country = Array.isArray(owner.country) ? owner.country[0] : owner.country

        // Build an explicit plain object — avoids circular reference errors
        // when Next.js serializes the RSC payload (spread of Supabase rows can
        // include non-serializable internal references)
        return {
          id: owner.id,
          name: owner.name ?? "",
          first_name: owner.first_name ?? "",
          last_name: owner.last_name ?? "",
          owner_type: owner.owner_type ?? "Propietario",
          real_estate_agency: owner.real_estate_agency ?? null,
          email: owner.email ?? null,
          phone: owner.phone ?? "",
          secondary_phone: owner.secondary_phone ?? null,
          address: owner.address ?? null,
          city_id: owner.city_id ?? null,
          province_id: owner.province_id ?? null,
          country_id: owner.country_id ?? null,
          cityId: owner.city_id ?? null,
          provinceId: owner.province_id ?? null,
          countryId: owner.country_id ?? null,
          id_number: owner.id_number ?? null,
          tax_id: owner.tax_id ?? null,
          notes: owner.notes ?? null,
          is_active: owner.is_active ?? true,
          isActive: owner.is_active ?? true,
          created_at: owner.created_at ?? null,
          updated_at: owner.updated_at ?? null,
          city: city ? { id: city.id, name: city.name } : null,
          province: province ? { id: province.id, name: province.name } : null,
          country: country ? { id: country.id, name: country.name } : null,
          _count: {
            properties: count || 0,
          },
        }
      }),
    )

    return { success: true, data: ownersWithCounts }
  } catch (error) {
    serverLog.error("[getOwners]", error)
    return { success: false, error: "Error al obtener propietarios" }
  }
}

export async function getOwnerById(id: string) {
  try {
    const supabase = await createServerClient()

    const { data: owner, error } = await supabase
      .from("owners")
      .select(`
        *,
        city:cities(name),
        province:provinces(name),
        country:countries(name)
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
      first_name: firstName,
      last_name: lastName,
      owner_type: ownerType || "Propietario",
      real_estate_agency: realEstateAgency || null,
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

    const supabase = await createServerClient()
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

    const supabase = await createServerClient()
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
    const supabase = await createServerClient()

    const { count } = await supabase.from("properties").select("*", { count: "exact", head: true }).eq("owner_id", id)

    if (count && count > 0) {
      // Owner has properties, mark as inactive instead
      const { error: updateError } = await supabase.from("owners").update({ is_active: false }).eq("id", id)

      if (updateError) throw updateError

      revalidatePath("/owners")
      return {
        success: true,
        message: "El propietario tiene propiedades asignadas, se marcó como inactivo en lugar de eliminarlo",
      }
    }

    // Owner has no properties, safe to delete
    const { error } = await supabase.from("owners").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/owners")
    return { success: true, message: "Propietario eliminado correctamente" }
  } catch (error) {
    serverLog.error("[deleteOwner]", error)
    return { success: false, error: "Error al eliminar propietario" }
  }
}
