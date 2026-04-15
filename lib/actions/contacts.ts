"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { serverLog } from "@/lib/server-log"

export async function getAllContacts() {
  const adminClient = await createAdminClient()

  const { data: contacts, error } = await adminClient.from("Contact").select("*").order("lastName", { ascending: true })

  if (error) {
    serverLog.error("Error fetching contacts:", error)
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
    serverLog.error("Error fetching contact services:", servicesError)
    return contacts.map((contact) => ({
      ...contact,
      services: [],
    }))
  }

  // Build explicit plain objects — prevents Next.js RSC serializer from hitting
  // internal Supabase Proxy references on spread of row objects → stack overflow
  const contactsWithServices = contacts.map((contact) => {
    const services = (contactServices || [])
      .filter((cs) => cs.contactId === contact.id)
      .map((cs) => {
        const svc = cs.service as any
        return {
          service: svc
            ? {
                id: svc.id ?? null,
                name: svc.name ?? null,
                description: svc.description ?? null,
                isActive: svc.isActive ?? true,
              }
            : null,
        }
      })

    return {
      id: String(contact.id),
      firstName: contact.firstName ?? "",
      lastName: contact.lastName ?? "",
      company: contact.company ?? null,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      address: contact.address ?? null,
      website: contact.website ?? null,
      notes: contact.notes ?? null,
      isActive: contact.isActive ?? true,
      createdAt: contact.createdAt ?? null,
      updatedAt: contact.updatedAt ?? null,
      services,
    }
  })

  return contactsWithServices
}

export async function getContactById(id: string) {
  const supabase = await createAdminClient()

  const { data: contact, error } = await supabase.from("Contact").select("*").eq("id", id).single()

  if (error) {
    serverLog.error("Error fetching contact:", error)
    return null
  }

  const { data: contactServices, error: servicesError } = await supabase
    .from("ContactService")
    .select(`
      service:Service(*)
    `)
    .eq("contactId", id)

  if (servicesError) {
    serverLog.error("Error fetching contact services:", servicesError)
  }

  return {
    id: String(contact.id),
    firstName: contact.firstName ?? "",
    lastName: contact.lastName ?? "",
    company: contact.company ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    address: contact.address ?? null,
    website: contact.website ?? null,
    notes: contact.notes ?? null,
    isActive: contact.isActive ?? true,
    createdAt: contact.createdAt ?? null,
    updatedAt: contact.updatedAt ?? null,
    services: (contactServices || []).map((cs) => {
      const svc = cs.service as any
      return {
        service: svc
          ? { id: svc.id ?? null, name: svc.name ?? null, description: svc.description ?? null, isActive: svc.isActive ?? true }
          : null,
      }
    }),
  }
}

export async function createContact(formData: FormData) {
  const supabase = await createAdminClient()

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
    serverLog.error("Error creating contact:", contactError)
    return { success: false, error: contactError.message }
  }

  if (serviceIds && contact) {
    const services = JSON.parse(serviceIds) as string[]
    const contactServices = services.map((serviceId) => ({
      contactId: contact.id,
      serviceId,
      createdAt: new Date().toISOString(),
    }))

    const { error: servicesError } = await supabase.from("ContactService").insert(contactServices)

    if (servicesError) {
      serverLog.error("Error assigning services:", servicesError)
    }
  }

  revalidatePath("/contacts")
  return { success: true, data: contact }
}

export async function updateContact(id: string, formData: FormData) {
  const supabase = await createAdminClient()

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
    serverLog.error("Error updating contact:", contactError)
    return { success: false, error: contactError.message }
  }

  await supabase.from("ContactService").delete().eq("contactId", id)

  if (serviceIds) {
    const services = JSON.parse(serviceIds) as string[]
    const contactServices = services.map((serviceId) => ({
      contactId: id,
      serviceId,
      createdAt: new Date().toISOString(),
    }))

    const { error: servicesError } = await supabase.from("ContactService").insert(contactServices)

    if (servicesError) {
      serverLog.error("Error updating services:", servicesError)
    }
  }

  revalidatePath("/contacts")
  return { success: true }
}

export async function deleteContact(id: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("Contact").delete().eq("id", id)

  if (error) {
    serverLog.error("Error deleting contact:", error)

    if (error.code === "23503") {
      const { error: updateError } = await supabase
        .from("Contact")
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        serverLog.error("Error deactivating contact:", updateError)
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
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("Service")
    .select("*")
    .eq("isActive", true)
    .order("name", { ascending: true })

  if (error) {
    serverLog.error("Error fetching services:", error)
    return []
  }

  return data || []
}
