"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/server"
import { z } from "zod"

const propertyTypeSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

export async function getPropertyTypes() {
  try {
    const supabase = await createAdminClient()

    const { data: propertyTypes, error } = await supabase
      .from("property_types")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error

    return propertyTypes || []
  } catch {
    throw new Error("Error al obtener los tipos de propiedad")
  }
}

export async function getActivePropertyTypes() {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("property_types")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch {
    throw new Error("Error al obtener los tipos de propiedad activos")
  }
}

export async function getPropertyTypeById(id: string) {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase.from("property_types").select("*").eq("id", id).single()

    if (error) throw error

    return data
  } catch {
    throw new Error("Error al obtener el tipo de propiedad")
  }
}

export async function createPropertyType(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
    }

    const validated = propertyTypeSchema.parse(data)

    const supabase = await createAdminClient()

    const { data: propertyType, error } = await supabase.from("property_types").insert(validated).select().single()

    if (error) {
      throw error
    }

    revalidatePath("/property-types")
    return propertyType
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw new Error("Error al crear el tipo de propiedad")
  }
}

export async function updatePropertyType(id: string, formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      is_active: formData.get("is_active") === "true" || formData.get("is_active") === "on",
    }

    const validated = propertyTypeSchema.parse(data)
    const supabase = await createAdminClient()

    const { data: propertyType, error } = await supabase
      .from("property_types")
      .update(validated)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/property-types")
    revalidatePath(`/property-types/${id}/edit`)
    return propertyType
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message)
    }
    throw new Error("Error al actualizar el tipo de propiedad")
  }
}

export async function deletePropertyType(id: string) {
  try {
    const supabase = await createAdminClient()

    const { data: propertyType } = await supabase.from("property_types").select("*").eq("id", id).single()

    if (!propertyType) {
      throw new Error("Tipo de propiedad no encontrado")
    }

    const { error } = await supabase.from("property_types").delete().eq("id", id)

    if (error) {
      if (error.code === "23503") {
        const { error: updateError } = await supabase.from("property_types").update({ is_active: false }).eq("id", id)

        if (updateError) throw updateError

        revalidatePath("/property-types")
        return {
          success: true,
          wasDeactivated: true,
          message: `No se puede eliminar el tipo de propiedad porque tiene propiedades asociadas. Se marcó como inactivo.`,
        }
      }
      throw error
    }

    revalidatePath("/property-types")
    return { success: true, wasDeactivated: false }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Error al eliminar el tipo de propiedad" }
  }
}
