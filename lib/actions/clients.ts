"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  address: z.string().optional(),
  city_id: z.string().optional(),
  province_id: z.string().optional(),
  country_id: z.string().optional(),
  preferred_property_type_id: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function getClients() {
  try {
    const supabase = await createServerClient()
    
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        city:cities(name),
        province:provinces(name),
        country:countries(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: clients }
  } catch (error) {
    console.error("[getClients] Error:", error)
    return { success: false, error: "Error al obtener clientes" }
  }
}

export async function getClientById(id: string) {
  try {
    const supabase = await createServerClient()
    
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        city:cities(name),
        province:provinces(name),
        country:countries(name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!client) return { success: false, error: "Cliente no encontrado" }

    return { success: true, data: client }
  } catch (error) {
    console.error("[getClientById] Error:", error)
    return { success: false, error: "Error al obtener cliente" }
  }
}

export async function createClient(data: z.infer<typeof clientSchema>) {
  try {
    const validated = clientSchema.parse(data)
    const supabase = await createServerClient()

    const { data: client, error } = await supabase
      .from('clients')
      .insert(validated)
      .select()
      .single()

    if (error) throw error

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
    const supabase = await createServerClient()

    const { data: client, error } = await supabase
      .from('clients')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

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
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath("/clients")
    return { success: true }
  } catch (error) {
    console.error("[deleteClient] Error:", error)
    return { success: false, error: "Error al eliminar cliente" }
  }
}
