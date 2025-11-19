"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"
import crypto from "crypto"

const ownerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
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
      .from('owners')
      .select(`
        *,
        city:cities(name),
        province:provinces(name),
        country:countries(name),
        properties:properties(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const transformedOwners = owners?.map(owner => ({
      ...owner,
      _count: {
        properties: owner.properties?.length || 0
      }
    })) || []

    return { success: true, data: transformedOwners }
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

export async function createOwner(data: {
  name: string
  email: string
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
}) {
  try {
    const ownerData = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
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
    const { data: owner, error } = await supabase
      .from('owners')
      .insert(ownerData)
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

export async function updateOwner(id: string, data: {
  name: string
  email: string
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
}) {
  try {
    const ownerData = {
      name: data.name,
      email: data.email,
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
    const { data: owner, error } = await supabase
      .from('owners')
      .update(ownerData)
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
