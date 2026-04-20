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

    const supabase = await createAdminClient()

    const { data: clients, error } = await supabase
      .from("clients")
      .select(`
        id, name, email, phone, secondary_phone, address,
        city_id, province_id, country_id, occupation,
        budget_min, budget_max, preferred_property_type_id, preferred_transaction_type,
        notes, source, is_active, created_at, updated_at, agent_id,
        city:cities!clients_city_id_fkey(id, name),
        province:provinces!clients_province_id_fkey(id, name),
        country:countries!clients_country_id_fkey(id, name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Single query for appointment counts
    const clientIds = (clients || []).map((c) => c.id)
    const { data: apptCounts } = clientIds.length > 0
      ? await supabase.from("appointments").select("client_id").in("client_id", clientIds)
      : { data: [] }

    const apptMap: Record<string, number> = {}
    for (const row of apptCounts ?? []) {
      if (row.client_id) apptMap[row.client_id] = (apptMap[row.client_id] ?? 0) + 1
    }

    const clientsWithCounts = (clients || []).map((client) => {
      const city = Array.isArray(client.city) ? client.city[0] : client.city
      const province = Array.isArray(client.province) ? client.province[0] : client.province
      const country = Array.isArray(client.country) ? client.country[0] : client.country

      return {
        id: String(client.id),
        name: client.name ?? "",
        email: client.email ?? null,
        phone: client.phone ?? "",
        secondaryPhone: client.secondary_phone ?? null,
        address: client.address ?? null,
        cityId: client.city_id ?? null,
        provinceId: client.province_id ?? null,
        countryId: client.country_id ?? null,
        occupation: client.occupation ?? null,
        budget: client.budget_max || client.budget_min || null,
        preferredPropertyTypeId: client.preferred_property_type_id ?? null,
        preferredTransactionType: client.preferred_transaction_type ?? null,
        notes: client.notes ?? null,
        source: client.source ?? null,
        isActive: client.is_active ?? true,
        createdAt: client.created_at ?? null,
        updatedAt: client.updated_at ?? null,
        agentId: client.agent_id ?? null,
        city: city ? { id: String(city.id), name: String(city.name) } : null,
        province: province ? { id: String(province.id), name: String(province.name) } : null,
        country: country ? { id: String(country.id), name: String(country.name) } : null,
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
      .from("clients")
      .select(`
        *,
        city:cities!clients_city_id_fkey(name),
        province:provinces!clients_province_id_fkey(name),
        country:countries!clients_country_id_fkey(name)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    if (!client) return { success: false, error: "Cliente no encontrado" }

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
      email: validated.email || null,
      phone: validated.phone,
      secondary_phone: validated.secondaryPhone || null,
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
      agent_id: validated.agentId || null,
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

    const supabase = await createAdminClient()

    const clientData: any = {
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone,
      secondary_phone: validated.secondaryPhone || null,
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
      agent_id: validated.agentId || null,
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

    const supabase = await createAdminClient()

    const { error } = await supabase.from("clients").delete().eq("id", id)

    if (error) {
      if (error.code === "23503") {
        const { error: updateError } = await supabase
          .from("clients")
          .update({ is_active: false })
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

export async function getAllClients() {
  return getClients()
}
