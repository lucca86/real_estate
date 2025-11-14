"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"


// Country actions
export async function createCountry(formData: FormData) {
  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !code) {
    throw new Error("Nombre y código son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Country')
      .insert({
        name,
        code: code.toUpperCase(),
        isActive,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[createCountry] Error:", error)
    throw new Error(error.message || "Error al crear el país")
  }
}

export async function updateCountry(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !code) {
    throw new Error("Nombre y código son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Country')
      .update({
        name,
        code: code.toUpperCase(),
        isActive,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[updateCountry] Error:", error)
    throw new Error(error.message || "Error al actualizar el país")
  }
}

// Province actions
export async function createProvince(formData: FormData) {
  const name = formData.get("name") as string
  const countryId = formData.get("countryId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !countryId) {
    throw new Error("Nombre y país son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Province')
      .insert({ name, countryId, isActive })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[createProvince] Error:", error)
    throw new Error(error.message || "Error al crear la provincia")
  }
}

export async function updateProvince(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const countryId = formData.get("countryId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !countryId) {
    throw new Error("Nombre y país son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Province')
      .update({ name, countryId, isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[updateProvince] Error:", error)
    throw new Error(error.message || "Error al actualizar la provincia")
  }
}

// City actions
export async function createCity(formData: FormData) {
  const name = formData.get("name") as string
  const provinceId = formData.get("provinceId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !provinceId) {
    throw new Error("Nombre y provincia son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('City')
      .insert({ name, provinceId, isActive })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[createCity] Error:", error)
    throw new Error(error.message || "Error al crear la ciudad")
  }
}

export async function updateCity(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const provinceId = formData.get("provinceId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !provinceId) {
    throw new Error("Nombre y provincia son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('City')
      .update({ name, provinceId, isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[updateCity] Error:", error)
    throw new Error(error.message || "Error al actualizar la ciudad")
  }
}

// Neighborhood actions
export async function createNeighborhood(formData: FormData) {
  const name = formData.get("name") as string
  const cityId = formData.get("cityId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !cityId) {
    throw new Error("Nombre y ciudad son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Neighborhood')
      .insert({ name, cityId, isActive })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[createNeighborhood] Error:", error)
    throw new Error(error.message || "Error al crear el barrio")
  }
}

export async function updateNeighborhood(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const cityId = formData.get("cityId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !cityId) {
    throw new Error("Nombre y ciudad son requeridos")
  }

  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Neighborhood')
      .update({ name, cityId, isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/locations")
    return data
  } catch (error: any) {
    console.error("[updateNeighborhood] Error:", error)
    throw new Error(error.message || "Error al actualizar el barrio")
  }
}

// Delete action for all location types
export async function deleteLocation(type: "country" | "province" | "city" | "neighborhood", id: string) {
  try {
    const supabase = await createServerClient()
    const table = type.charAt(0).toUpperCase() + type.slice(1)
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath("/locations")
  } catch (error: any) {
    console.error(`[deleteLocation] Error deleting ${type}:`, error)
    throw new Error(error.message || `Error al eliminar el ${type}`)
  }
}

// Get functions for cascading location selects
export async function getCountries() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Country')
      .select('id, name, code')
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[getCountries] Error:", error)
    return []
  }
}

export async function getProvinces(countryId: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Province')
      .select('id, name')
      .eq('countryId', countryId)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[getProvinces] Error:", error)
    return []
  }
}

export async function getCities(provinceId: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('City')
      .select('id, name')
      .eq('provinceId', provinceId)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[getCities] Error:", error)
    return []
  }
}

export async function getNeighborhoods(cityId: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('Neighborhood')
      .select('id, name')
      .eq('cityId', cityId)
      .eq('isActive', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[getNeighborhoods] Error:", error)
    return []
  }
}
