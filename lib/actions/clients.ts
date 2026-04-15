"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
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
    const supabase = await createAdminClient()

    const { data: agents, error } = await supabase
      .from("User")
      .select("id, name, email, role")
      .in("role", ["VENDEDOR", "ADMIN"])
      .eq("isActive", true)
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

    const supabase = await createAdminClient()

    let query = supabase
      .from("Client")
      .select(`
        id, name, email, phone, secondaryPhone, idNumber, address,
        cityId, provinceId, countryId, occupation,
        budgetMin, budgetMax, preferredPropertyTypeId, preferredTransactionType,
        notes, source, isActive, agentId, createdAt, updatedAt,
        city:City(id, name),
        province:Province(id, name),
        country:Country(id, name),
        agent:User!Client_agentId_fkey(id, name, email)
      `)
      .order("createdAt", { ascending: false })

    if (currentUser.role === "VENDEDOR") {
      query = query.eq("agentId", currentUser.id)
    }

    const { data: clients, error } = await query

    if (error) throw error

    // Single query for appointment counts instead of N parallel queries
    const clientIds = (clients || []).map((c) => c.id)
    const { data: apptCounts } = clientIds.length > 0
      ? await supabase.from("Appointment").select("clientId").in("clientId", clientIds)
      : { data: [] }

    const apptMap: Record<string, number> = {}
    for (const row of apptCounts ?? []) {
      if (row.clientId) apptMap[row.clientId] = (apptMap[row.clientId] ?? 0) + 1
    }

    const clientsWithCounts: any[] = (clients || []).map((client) => {
      const city = Array.isArray(client.city) && client.city.length > 0 ? client.city[0] : (client.city ?? null)
      const province = Array.isArray(client.province) && client.province.length > 0 ? client.province[0] : (client.province ?? null)
      const country = Array.isArray(client.country) && client.country.length > 0 ? client.country[0] : (client.country ?? null)
      const agent = Array.isArray(client.agent) && client.agent.length > 0 ? client.agent[0] : (client.agent ?? null)

      return {
        id: String(client.id),
        name: client.name ?? "",
        email: client.email ?? null,
        phone: client.phone ?? "",
        secondary_phone: (client as any).secondaryPhone ?? null,
        id_number: (client as any).idNumber ?? null,
        address: client.address ?? null,
        city_id: (client as any).cityId ?? null,
        province_id: (client as any).provinceId ?? null,
        country_id: (client as any).countryId ?? null,
        occupation: client.occupation ?? null,
        budget_min: (client as any).budgetMin ?? null,
        budget_max: (client as any).budgetMax ?? null,
        preferred_property_type_id: (client as any).preferredPropertyTypeId ?? null,
        preferred_transaction_type: (client as any).preferredTransactionType ?? null,
        notes: client.notes ?? null,
        source: client.source ?? null,
        is_active: (client as any).isActive ?? true,
        isActive: (client as any).isActive ?? true,
        agent_id: (client as any).agentId ?? null,
        agentId: (client as any).agentId ?? null,
        created_at: (client as any).createdAt ?? null,
        updated_at: (client as any).updatedAt ?? null,
        budget: (client as any).budgetMax || (client as any).budgetMin,
        city,
        province,
        country,
        agent,
        _count: { appointments: apptMap[client.id] ?? 0 },
      }
    })

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

    const supabase = await createAdminClient()

    const { data: client, error } = await supabase
      .from("Client")
      .select(`
        *,
        city:City(name),
        province:Province(name),
        country:Country(name),
        agent:User!Client_agentId_fkey(id, name, email)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    if (!client) return { success: false, error: "Cliente no encontrado" }

    if (currentUser.role === "VENDEDOR" && (client as any).agentId !== currentUser.id) {
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

    const supabase = await createAdminClient()

    const clientData = {
      id: crypto.randomUUID(),
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      secondaryPhone: validated.secondaryPhone || null,
      idNumber: validated.idNumber || null,
      address: validated.address || null,
      cityId: validated.cityId || null,
      provinceId: validated.provinceId || null,
      countryId: validated.countryId || null,
      occupation: validated.occupation || null,
      budgetMin: validated.budgetMin || null,
      budgetMax: validated.budgetMax || null,
      preferredPropertyTypeId: validated.preferredPropertyTypeId || null,
      preferredTransactionType: validated.preferredTransactionType || null,
      notes: validated.notes || null,
      source: validated.source || null,
      isActive: validated.isActive,
      agentId: currentUser.role === "ADMIN" && validated.agentId ? validated.agentId : currentUser.id,
    }

    const { data: client, error } = await supabase.from("Client").insert(clientData).select().single()

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

    const supabase = await createAdminClient()

    if (currentUser.role === "VENDEDOR") {
      const { data: existingClient } = await supabase.from("Client").select("agentId").eq("id", id).single()

      if ((existingClient as any)?.agentId !== currentUser.id) {
        return { success: false, error: "No tienes permiso para editar este cliente" }
      }
    }

    const clientData: any = {
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      secondaryPhone: validated.secondaryPhone || null,
      idNumber: validated.idNumber || null,
      address: validated.address || null,
      cityId: validated.cityId || null,
      provinceId: validated.provinceId || null,
      countryId: validated.countryId || null,
      occupation: validated.occupation || null,
      budgetMin: validated.budgetMin || null,
      budgetMax: validated.budgetMax || null,
      preferredPropertyTypeId: validated.preferredPropertyTypeId || null,
      preferredTransactionType: validated.preferredTransactionType || null,
      notes: validated.notes || null,
      source: validated.source || null,
      isActive: validated.isActive,
    }

    if (currentUser.role === "ADMIN" && validated.agentId) {
      clientData.agentId = validated.agentId
    }

    const { data: client, error } = await supabase.from("Client").update(clientData).eq("id", id).select().single()

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

    const supabase = await createAdminClient()

    if (currentUser.role === "VENDEDOR") {
      const { data: existingClient } = await supabase.from("Client").select("agentId").eq("id", id).single()

      if ((existingClient as any)?.agentId !== currentUser.id) {
        return { success: false, error: "No tienes permiso para eliminar este cliente" }
      }
    }

    const { error } = await supabase.from("Client").delete().eq("id", id)

    if (error) {
      if (error.code === "23503") {
        const { error: updateError } = await supabase
          .from("Client")
          .update({ isActive: false })
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

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("Client")
      .update({ agentId: newAgentId })
      .eq("id", clientId)

    if (error) throw error

    revalidatePath("/clients")
    return { success: true, message: "Agente reasignado exitosamente" }
  } catch {
    return { success: false, error: "Error al reasignar agente" }
  }
}
