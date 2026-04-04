"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"
import crypto from "crypto"
import { getCurrentUser } from "@/lib/auth"

const clientSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es requerido"),
  secondaryPhone: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  cityId: z.string().optional(),
  provinceId: z.string().optional(),
  countryId: z.string().optional(),
  occupation: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  preferredPropertyTypeId: z.string().optional(),
  preferredTransactionType: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  isActive: z.boolean().default(true),
  agentId: z.string().optional(),
})

export async function getAgents() {
  try {
    const supabase = await createServerClient()

    const { data: agents, error } = await supabase
      .from("users")
      .select("id, name, email, role")
      .in("role", ["VENDEDOR", "ADMIN"])
      .eq("is_active", true)
      .order("name")

    if (error) throw error

    return { success: true, data: agents || [] }
  } catch {
    return { success: false, error: "Error al obtener agentes" }
  }
}

export async function getClients() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    const supabase = await createServerClient()

    let query = supabase
      .from("clients")
      .select(`
        id,
        name,
        email,
        phone,
        secondary_phone,
        id_number,
        address,
        city_id,
        province_id,
        country_id,
        occupation,
        budget_min,
        budget_max,
        preferred_property_type_id,
        preferred_transaction_type,
        notes,
        source,
        is_active,
        agent_id,
        created_at,
        updated_at,
        city:cities(id, name),
        province:provinces(id, name),
        country:countries(id, name),
        agent:users!clients_agent_id_fkey(id, name, email)
      `)
      .order("created_at", { ascending: false })

    if (currentUser.role === "VENDEDOR") {
      query = query.eq("agent_id", currentUser.id)
    }

    const { data: clients, error } = await query

    if (error) throw error

    const clientsWithCounts: any[] = await Promise.all(
      (clients || []).map(async (client) => {
        const { count } = await supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .eq("client_id", client.id)

        const city = Array.isArray(client.city) && client.city.length > 0 ? client.city[0] : null
        const province = Array.isArray(client.province) && client.province.length > 0 ? client.province[0] : null
        const country = Array.isArray(client.country) && client.country.length > 0 ? client.country[0] : null
        const agent = Array.isArray(client.agent) && client.agent.length > 0 ? client.agent[0] : null

        return {
          ...client,
          isActive: client.is_active,
          agentId: client.agent_id,
          budget: client.budget_max || client.budget_min,
          city,
          province,
          country,
          agent,
          _count: {
            appointments: count || 0,
          },
        }
      }),
    )

    return { success: true, data: clientsWithCounts }
  } catch {
    return { success: false, error: "Error al obtener clientes" }
  }
}

export async function getClientById(id: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    const supabase = await createServerClient()

    const { data: client, error } = await supabase
      .from("clients")
      .select(`
        *,
        city:cities(name),
        province:provinces(name),
        country:countries(name),
        agent:users!clients_agent_id_fkey(id, name, email)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    if (!client) return { success: false, error: "Cliente no encontrado" }

    if (currentUser.role === "VENDEDOR" && client.agent_id !== currentUser.id) {
      return { success: false, error: "No tienes permiso para ver este cliente" }
    }

    return { success: true, data: client }
  } catch {
    return { success: false, error: "Error al obtener cliente" }
  }
}

export async function createClient(data: z.infer<typeof clientSchema>) {
  try {
    const validated = clientSchema.parse(data)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    const supabase = await createServerClient()

    const clientData = {
      id: crypto.randomUUID(),
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      secondary_phone: validated.secondaryPhone || null,
      id_number: validated.idNumber || null,
      address: validated.address || null,
      city_id: validated.cityId || null,
      province_id: validated.provinceId || null,
      country_id: validated.countryId || null,
      occupation: validated.occupation || null,
      budget_min: validated.budgetMin || null,
      budget_max: validated.budgetMax || null,
      preferred_property_type_id: validated.preferredPropertyTypeId || null,
      preferred_transaction_type: validated.preferredTransactionType || null,
      notes: validated.notes || null,
      source: validated.source || null,
      is_active: validated.isActive,
      agent_id: currentUser.role === "ADMIN" && validated.agentId ? validated.agentId : currentUser.id,
    }

    const { data: client, error } = await supabase.from("clients").insert(clientData).select().single()

    if (error) throw error

    revalidatePath("/clients")
    return { success: true, data: client }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Error al crear cliente" }
  }
}

export async function updateClient(id: string, data: z.infer<typeof clientSchema>) {
  try {
    const validated = clientSchema.parse(data)

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    const supabase = await createServerClient()

    if (currentUser.role === "VENDEDOR") {
      const { data: existingClient } = await supabase.from("clients").select("agent_id").eq("id", id).single()

      if (existingClient?.agent_id !== currentUser.id) {
        return { success: false, error: "No tienes permiso para editar este cliente" }
      }
    }

    const clientData: any = {
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      secondary_phone: validated.secondaryPhone || null,
      id_number: validated.idNumber || null,
      address: validated.address || null,
      city_id: validated.cityId || null,
      province_id: validated.provinceId || null,
      country_id: validated.countryId || null,
      occupation: validated.occupation || null,
      budget_min: validated.budgetMin || null,
      budget_max: validated.budgetMax || null,
      preferred_property_type_id: validated.preferredPropertyTypeId || null,
      preferred_transaction_type: validated.preferredTransactionType || null,
      notes: validated.notes || null,
      source: validated.source || null,
      is_active: validated.isActive,
      updated_at: new Date().toISOString(),
    }

    if (currentUser.role === "ADMIN" && validated.agentId) {
      clientData.agent_id = validated.agentId
    }

    const { data: client, error } = await supabase.from("clients").update(clientData).eq("id", id).select().single()

    if (error) throw error

    revalidatePath("/clients")
    revalidatePath(`/clients/${id}`)
    return { success: true, data: client }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Error al actualizar cliente" }
  }
}

export async function deleteClient(id: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    const supabase = await createServerClient()

    if (currentUser.role === "VENDEDOR") {
      const { data: existingClient } = await supabase.from("clients").select("agent_id").eq("id", id).single()

      if (existingClient?.agent_id !== currentUser.id) {
        return { success: false, error: "No tienes permiso para eliminar este cliente" }
      }
    }

    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) {
      if (error.code === "23503") {
        const { error: updateError } = await supabase
          .from("clients")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (updateError) throw updateError

        revalidatePath("/clients")
        return {
          success: true,
          wasDeactivated: true,
          message: `No se puede eliminar el cliente porque tiene registros asociados. Se marcó como inactivo.`,
        }
      }
      throw error
    }

    revalidatePath("/clients")
    return { success: true, wasDeactivated: false }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al eliminar cliente",
    }
  }
}

export async function reassignClientAgent(clientId: string, newAgentId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "No tienes permiso para realizar esta acción" }
    }

    const supabase = await createServerClient()

    const { error } = await supabase
      .from("clients")
      .update({ agent_id: newAgentId, updated_at: new Date().toISOString() })
      .eq("id", clientId)

    if (error) throw error

    revalidatePath("/clients")
    return { success: true, message: "Agente reasignado exitosamente" }
  } catch {
    return { success: false, error: "Error al reasignar agente" }
  }
}
