"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"
import crypto from "crypto"

const ownerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
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
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
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

        return {
          ...owner,
          isActive: owner.is_active,
          city: Array.isArray(owner.city) ? owner.city[0] : owner.city,
          province: Array.isArray(owner.province) ? owner.province[0] : owner.province,
          country: Array.isArray(owner.country) ? owner.country[0] : owner.country,
          _count: {
            properties: count || 0,
          },
        }
      }),
    )

    return { success: true, data: ownersWithCounts }
  } catch (error) {
    console.error("[getOwners] Error:", error)
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
    console.error("[getOwnerById] Error:", error)
    return { success: false, error: "Error al obtener propietario" }
  }
}

export async function createOwner(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string

    if (!name || !email || !phone) {
      return { success: false, error: "Nombre, email y teléfono son requeridos" }
    }

    const ownerData = {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      secondary_phone: null,
      address: null,
      city_id: null,
      province_id: null,
      country_id: null,
      id_number: null,
      tax_id: null,
      notes: null,
      is_active: true,
    }

    const supabase = await createServerClient()
    const { data: owner, error } = await supabase.from("owners").insert(ownerData).select().single()

    if (error) throw error

    revalidatePath("/owners")
    return { success: true, owner: { id: owner.id, name: owner.name } }
  } catch (error) {
    console.error("[createOwner] Error:", error)
    return { success: false, error: "Error al crear propietario" }
  }
}

export async function updateOwner(
  id: string,
  data: {
    name: string
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
      name: data.name,
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
    console.error("[updateOwner] Error:", error)
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
    console.error("[deleteOwner] Error:", error)
    return { success: false, error: "Error al eliminar propietario" }
  }
}
