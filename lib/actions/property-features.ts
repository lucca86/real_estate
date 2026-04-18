"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type PropertyFeature = {
  id: string
  name: string
  type: "CARACTERISTICA" | "AMENIDAD"
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getPropertyFeatures(type?: "CARACTERISTICA" | "AMENIDAD") {
  const supabase = await createClient()

  let query = supabase.from("property_features").select("*").eq("is_active", true).order("name")

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query

  if (error) throw error
  return data as PropertyFeature[]
}

export async function getAllPropertyFeatures() {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("property_features").select("*").order("type").order("name")

  if (error) throw error

  return data as PropertyFeature[]
}

export async function getPropertyFeatureById(id: string) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase.from("property_features").select("*").eq("id", id).single()

  if (error) return null

  return data as PropertyFeature
}

export async function createPropertyFeature(formData: FormData) {
  const supabase = await createAdminClient()

  const name = formData.get("name") as string
  const type = formData.get("type") as "CARACTERISTICA" | "AMENIDAD"

  const { error } = await supabase.from("property_features").insert({ name, type })

  if (error) return { success: false, error: error.message }

  revalidatePath("/property-features")
  return { success: true }
}

export async function updatePropertyFeature(id: string, formData: FormData) {
  const supabase = await createAdminClient()

  const name = formData.get("name") as string
  const type = formData.get("type") as "CARACTERISTICA" | "AMENIDAD"
  const is_active_str = formData.get("is_active")
  const is_active = is_active_str === "true" || is_active_str === "on"

  const { data, error } = await supabase
    .from("property_features")
    .update({ name, type, is_active, updated_at: new Date().toISOString() })
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

export async function togglePropertyFeatureStatus(id: string, is_active: boolean) {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("property_features")
    .update({ is_active, updated_at: new Date().toISOString() })
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

  const { error } = await supabase.from("property_features").delete().eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/property-features")
  return { success: true }
}

export async function getPropertyFeatureAssignments(propertyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("property_feature_assignments")
    .select("feature_id, property_features(*)")
    .eq("property_id", propertyId)

  if (error) throw error
  return data
}

export async function assignFeaturesToProperty(propertyId: string, featureIds: string[]) {
  const supabase = await createAdminClient()

  // Eliminar asignaciones existentes
  await supabase.from("property_feature_assignments").delete().eq("property_id", propertyId)

  // Insertar nuevas asignaciones
  if (featureIds.length > 0) {
    const assignments = featureIds.map((feature_id) => ({
      property_id: propertyId,
      feature_id,
    }))

    const { error } = await supabase.from("property_feature_assignments").insert(assignments)

    if (error) return { success: false, error: error.message }
  }

  revalidatePath(`/properties/${propertyId}`)
  return { success: true }
}
