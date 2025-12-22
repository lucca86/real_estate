"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAllServices() {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("Service").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching services:", error)
    return []
  }

  return data || []
}

export async function getServiceById(id: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("Service").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching service:", error)
    return null
  }

  return data
}

export async function createService(formData: FormData) {
  const supabase = await createAdminClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const isActive = formData.get("isActive") === "true"

  const { data, error } = await supabase
    .from("Service")
    .insert({
      name,
      description,
      isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating service:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/services")
  revalidatePath("/contacts")
  return { success: true, data }
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createAdminClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const isActive = formData.get("isActive") === "true"

  const { error } = await supabase
    .from("Service")
    .update({
      name,
      description,
      isActive,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating service:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/services")
  revalidatePath("/contacts")
  return { success: true }
}

export async function deleteService(id: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("Service").delete().eq("id", id)

  if (error) {
    console.error("Error deleting service:", error)

    if (error.code === "23503") {
      const { error: updateError } = await supabase
        .from("Service")
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        console.error("Error deactivating service:", updateError)
        return { success: false, error: updateError.message }
      }

      revalidatePath("/services")
      revalidatePath("/contacts")
      return {
        success: true,
        wasDeactivated: true,
        message: `No se puede eliminar el servicio porque tiene contactos asociados. Se marcó como inactivo.`,
      }
    }

    return { success: false, error: error.message }
  }

  revalidatePath("/services")
  revalidatePath("/contacts")
  return { success: true, wasDeactivated: false }
}
