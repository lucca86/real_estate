"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type PropertyFeature = {
  id: string
  name: string
  type: "CARACTERISTICA" | "AMENIDAD"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function getPropertyFeatures(type?: "CARACTERISTICA" | "AMENIDAD") {
  const supabase = await createAdminClient()

  let query = supabase.from("PropertyFeature").select("*").eq("isActive", true).order("name")

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query

  if (error) throw error
  return data as PropertyFeature[]
}

export async function getAllPropertyFeatures() {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("PropertyFeature").select("*").order("type").order("name")

  if (error) throw error

  return data as PropertyFeature[]
}

export async function getPropertyFeatureById(id: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("PropertyFeature").select("*").eq("id", id).single()

  if (error) return null

  return data as PropertyFeature
}

export async function createPropertyFeature(formData: FormData) {
  const supabase = await createAdminClient()

  const name = formData.get("name") as string
  const type = formData.get("type") as "CARACTERISTICA" | "AMENIDAD"

  const { error } = await supabase.from("PropertyFeature").insert({ name, type })

  if (error) return { success: false, error: error.message }

  revalidatePath("/property-features")
  return { success: true }
}

export async function updatePropertyFeature(id: string, formData: FormData) {
  const supabase = await createAdminClient()

  const name = formData.get("name") as string
  const type = formData.get("type") as "CARACTERISTICA" | "AMENIDAD"
  const isActiveStr = formData.get("is_active")
  const isActive = isActiveStr === "true" || isActiveStr === "on"

  const { data, error } = await supabase
    .from("PropertyFeature")
    .update({ name, type, isActive })
    .eq("id", id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  if (!data) {
    return { success: false, error: "No se encontró la característica" }
  }

  revalidatePath("/property-features")
  revalidatePath(`/property-features/${id}/edit`)
  return { success: true, data }
}

export async function togglePropertyFeatureStatus(id: string, isActive: boolean) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("PropertyFeature")
    .update({ isActive })
    .eq("id", id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  if (!data) {
    return { success: false, error: "No se encontró la característica" }
  }

  revalidatePath("/property-features")
  return { success: true, data }
}

export async function deletePropertyFeature(id: string) {
  const supabase = await createAdminClient()

  const { error } = await supabase.from("PropertyFeature").delete().eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/property-features")
  return { success: true }
}

export async function getPropertyFeatureAssignments(propertyId: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("PropertyFeatureAssignment")
    .select("featureId, feature:PropertyFeature(*)")
    .eq("propertyId", propertyId)

  if (error) throw error
  return data
}

export async function assignFeaturesToProperty(propertyId: string, featureIds: string[]) {
  const supabase = await createAdminClient()

  // Eliminar asignaciones existentes
  await supabase.from("PropertyFeatureAssignment").delete().eq("propertyId", propertyId)

  // Insertar nuevas asignaciones
  if (featureIds.length > 0) {
    const assignments = featureIds.map((featureId) => ({
      propertyId,
      featureId,
    }))

    const { error } = await supabase.from("PropertyFeatureAssignment").insert(assignments)

    if (error) return { success: false, error: error.message }
  }

  revalidatePath(`/properties/${propertyId}`)
  return { success: true }
}
