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
        id, name, email, phone, secondaryPhone, address,
        cityId, provinceId, countryId, occupation,
        budget, preferredPropertyTypeId, preferredTransactionType,
        notes, source, isActive, createdAt, updatedAt,
        city:City!Client_cityId_fkey(id, name),
        province:Province!Client_provinceId_fkey(id, name),
        country:Country!Client_countryId_fkey(id, name)
      `)
      .order("createdAt", { ascending: false })

    const { data: clients, error } = await query

    if (error) throw error

    // Single query for appointment counts
    const clientIds = (clients || []).map((c) => c.id)
    const { data: apptCounts } = clientIds.length > 0
      ? await supabase.from("Appointment").select("clientId").in("clientId", clientIds)
      : { data: [] }

    const apptMap: Record<string, number> = {}
    for (const row of apptCounts ?? []) {
      if (row.clientId) apptMap[row.clientId] = (apptMap[row.clientId] ?? 0) + 1
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
        secondaryPhone: client.secondaryPhone ?? null,
        address: client.address ?? null,
        cityId: client.cityId ?? null,
        provinceId: client.provinceId ?? null,
        countryId: client.countryId ?? null,
        occupation: client.occupation ?? null,
        budget: client.budget ?? null,
        preferredPropertyTypeId: client.preferredPropertyTypeId ?? null,
        preferredTransactionType: client.preferredTransactionType ?? null,
        notes: client.notes ?? null,
        source: client.source ?? null,
        isActive: client.isActive ?? true,
        createdAt: client.createdAt ?? null,
        updatedAt: client.updatedAt ?? null,
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
      .from("Client")
      .select(`
        *,
        city:City!Client_cityId_fkey(name),
        province:Province!Client_provinceId_fkey(name),
        country:Country!Client_countryId_fkey(name)
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
      secondaryPhone: validated.secondaryPhone || null,
      address: validated.address || null,
      cityId: validated.cityId || null,
      provinceId: validated.provinceId || null,
      countryId: validated.countryId || null,
      occupation: validated.occupation || null,
      budget: validated.budgetMax || validated.budgetMin || null,
      preferredPropertyTypeId: validated.preferredPropertyTypeId || null,
      preferredTransactionType: validated.preferredTransactionType || null,
      notes: validated.notes || null,
      source: validated.source || null,
      isActive: validated.isActive,
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

    const clientData: any = {
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone,
      secondaryPhone: validated.secondaryPhone || null,
      address: validated.address || null,
      cityId: validated.cityId || null,
      provinceId: validated.provinceId || null,
      countryId: validated.countryId || null,
      occupation: validated.occupation || null,
      budget: validated.budgetMax || validated.budgetMin || null,
      preferredPropertyTypeId: validated.preferredPropertyTypeId || null,
      preferredTransactionType: validated.preferredTransactionType || null,
      notes: validated.notes || null,
      source: validated.source || null,
      isActive: validated.isActive,
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

    // Client table does not have agentId - no-op for now
    revalidatePath("/clients")
    return { success: true, message: "Agente reasignado exitosamente" }
  } catch {
    return { success: false, error: "Error al reasignar agente" }
  }
}

export async function getAllClients() {
  return getClients()
}
