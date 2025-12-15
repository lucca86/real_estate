"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function getAllContacts() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()

  const { data: contacts, error } = await supabase.from("Contact").select("*").order("lastName", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching contacts:", error)
    return []
  }

  if (!contacts || contacts.length === 0) {
    return []
  }

  const contactIds = contacts.map((c) => c.id)
  const { data: contactServices, error: servicesError } = await adminClient
    .from("ContactService")
    .select(`
      contactId,
      service:Service(*)
    `)
    .in("contactId", contactIds)

  if (servicesError) {
    console.error("[v0] Error fetching contact services:", servicesError)
    // Return contacts without services rather than failing completely
    return contacts.map((contact) => ({
      ...contact,
      services: [],
    }))
  }

  const contactsWithServices = contacts.map((contact) => ({
    ...contact,
    services: (contactServices || [])
      .filter((cs) => cs.contactId === contact.id)
      .map((cs) => ({ service: cs.service })),
  }))

  return contactsWithServices
}

export async function getContactById(id: string) {
  const supabase = await createClient()

  const { data: contact, error } = await supabase.from("Contact").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching contact:", error)
    return null
  }

  const adminSupabase = createAdminClient()
  const { data: contactServices, error: servicesError } = await adminSupabase
    .from("ContactService")
    .select(`
      service:Service(*)
    `)
    .eq("contactId", id)

  if (servicesError) {
    console.error("Error fetching contact services:", servicesError)
  }

  return {
    ...contact,
    services: contactServices || [],
  }
}

export async function createContact(formData: FormData) {
  const supabase = await createClient()

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const company = formData.get("company") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const website = formData.get("website") as string
  const notes = formData.get("notes") as string
  const isActive = formData.get("isActive") === "true"
  const serviceIds = formData.get("serviceIds") as string

  console.log("[v0] createContact - company:", company)
  console.log("[v0] createContact - serviceIds:", serviceIds)

  // Crear contacto
  const { data: contact, error: contactError } = await supabase
    .from("Contact")
    .insert({
      firstName,
      lastName,
      company,
      email,
      phone,
      address,
      website,
      notes,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (contactError) {
    console.error("[v0] Error creating contact:", contactError)
    return { success: false, error: contactError.message }
  }

  console.log("[v0] Created contact:", contact)

  if (serviceIds && contact) {
    const adminSupabase = createAdminClient()
    const services = JSON.parse(serviceIds) as string[]
    const contactServices = services.map((serviceId) => ({
      contactId: contact.id,
      serviceId,
      createdAt: new Date().toISOString(),
    }))

    const { error: servicesError } = await adminSupabase.from("ContactService").insert(contactServices)

    if (servicesError) {
      console.error("[v0] Error assigning services:", servicesError)
    } else {
      console.log("[v0] Successfully assigned services")
    }
  }

  revalidatePath("/contacts")
  return { success: true, data: contact }
}

export async function updateContact(id: string, formData: FormData) {
  const supabase = await createClient()

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const company = formData.get("company") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const website = formData.get("website") as string
  const notes = formData.get("notes") as string
  const isActive = formData.get("isActive") === "true"
  const serviceIds = formData.get("serviceIds") as string

  // Actualizar contacto
  const { error: contactError } = await supabase
    .from("Contact")
    .update({
      firstName,
      lastName,
      company,
      email,
      phone,
      address,
      website,
      notes,
      isActive,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)

  if (contactError) {
    console.error("Error updating contact:", contactError)
    return { success: false, error: contactError.message }
  }

  const adminSupabase = createAdminClient()

  // Actualizar servicios - eliminar existentes y agregar nuevos
  await adminSupabase.from("ContactService").delete().eq("contactId", id)

  if (serviceIds) {
    const services = JSON.parse(serviceIds) as string[]
    const contactServices = services.map((serviceId) => ({
      contactId: id,
      serviceId,
      createdAt: new Date().toISOString(),
    }))

    const { error: servicesError } = await adminSupabase.from("ContactService").insert(contactServices)

    if (servicesError) {
      console.error("Error updating services:", servicesError)
    }
  }

  revalidatePath("/contacts")
  return { success: true }
}

export async function deleteContact(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("Contact").delete().eq("id", id)

  if (error) {
    console.error("Error deleting contact:", error)

    // Check if it's a foreign key constraint violation
    if (error.code === "23503") {
      // Instead of deleting, mark as inactive
      const { error: updateError } = await supabase
        .from("Contact")
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        console.error("Error deactivating contact:", updateError)
        return { success: false, error: updateError.message }
      }

      revalidatePath("/contacts")
      return {
        success: true,
        wasDeactivated: true,
        message: `No se puede eliminar el contacto porque tiene registros asociados. Se marcó como inactivo.`,
      }
    }

    return { success: false, error: error.message }
  }

  revalidatePath("/contacts")
  return { success: true, wasDeactivated: false }
}

export async function getAllServices() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("Service")
    .select("*")
    .eq("isActive", true)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching services:", error)
    return []
  }

  return data || []
}
