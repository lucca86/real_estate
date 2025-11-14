"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
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
    const supabase = await createServerClient()
    
    const { data: owners, error } = await supabase
      .from('owners')
      .select(`
        *,
        city:cities(name),
        province:provinces(name),
        country:countries(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: owners }
  } catch (error) {
    console.error("[getOwners] Error:", error)
    return { success: false, error: "Error al obtener propietarios" }
  }
}

export async function getOwnerById(id: string) {
  try {
    const supabase = await createServerClient()
    
    const { data: owner, error } = await supabase
      .from('owners')
      .select(`
        *,
        city:cities(name),
        province:provinces(name),
        country:countries(name)
      `)
      .eq('id', id)
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
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      secondaryPhone: formData.get("secondaryPhone") as string | undefined,
      address: formData.get("address") as string | undefined,
      city_id: formData.get("cityId") as string | undefined,
      province_id: formData.get("provinceId") as string | undefined,
      country_id: formData.get("countryId") as string | undefined,
      idNumber: formData.get("idNumber") as string | undefined,
      taxId: formData.get("taxId") as string | undefined,
      notes: formData.get("notes") as string | undefined,
      is_active: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    }

    const supabase = await createServerClient()
    const { data: owner, error} = await supabase
      .from('owners')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/owners")
    return { success: true, owner: { id: owner.id, name: owner.name } }
  } catch (error) {
    console.error("[createOwner] Error:", error)
    return { success: false, error: "Error al crear propietario" }
  }
}

export async function updateOwner(id: string, formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string | undefined,
      city_id: formData.get("cityId") as string | undefined,
      province_id: formData.get("provinceId") as string | undefined,
      country_id: formData.get("countryId") as string | undefined,
      notes: formData.get("notes") as string | undefined,
      is_active: formData.get("isActive") === "on",
    }

    const supabase = await createServerClient()
    const { data: owner, error } = await supabase
      .from('owners')
      .update(data)
      .eq('id', id)
      .select()
      .single()

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
    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath("/owners")
    return { success: true }
  } catch (error) {
    console.error("[deleteOwner] Error:", error)
    return { success: false, error: "Error al eliminar propietario" }
  }
}
