"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

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
      .from('countries')
      .insert({
        id: crypto.randomUUID(),
        name,
        code: code.toUpperCase(),
        is_active: isActive,
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
      .from('countries')
      .update({
        name,
        code: code.toUpperCase(),
        is_active: isActive,
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
    const { data, error} = await supabase
      .from('provinces')
      .insert({ 
        id: crypto.randomUUID(),
        name, 
        country_id: countryId, 
        is_active: isActive 
      })
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
      .from('provinces')
      .update({ name, country_id: countryId, is_active: isActive })
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
      .from('cities')
      .insert({ 
        id: crypto.randomUUID(),
        name, 
        province_id: provinceId, 
        is_active: isActive 
      })
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
      .from('cities')
      .update({ name, province_id: provinceId, is_active: isActive })
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
      .from('neighborhoods')
      .insert({ 
        id: crypto.randomUUID(),
        name, 
        city_id: cityId, 
        is_active: isActive 
      })
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
      .from('neighborhoods')
      .update({ name, city_id: cityId, is_active: isActive })
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
    const tableMap = {
      country: 'countries',
      province: 'provinces',
      city: 'cities',
      neighborhood: 'neighborhoods'
    }
    
    const { error } = await supabase
      .from(tableMap[type])
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
      .from('countries')
      .select('id, name, code')
      .eq('is_active', true)
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
      .from('provinces')
      .select('id, name')
      .eq('country_id', countryId)
      .eq('is_active', true)
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
      .from('cities')
      .select('id, name')
      .eq('province_id', provinceId)
      .eq('is_active', true)
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
      .from('neighborhoods')
      .select('id, name')
      .eq('city_id', cityId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[getNeighborhoods] Error:", error)
    return []
  }
}

export async function getAllCountries() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('countries')
      .select('id, name, code, is_active, created_at')
      .order('name', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error("[getAllCountries] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getAllProvinces() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('provinces')
      .select(`
        id,
        name,
        is_active,
        created_at,
        country:countries(id, name)
      `)
      .order('name', { ascending: true })

    if (error) throw error
    
    const transformedData = (data || []).map(province => ({
      ...province,
      country: Array.isArray(province.country) && province.country.length > 0 
        ? province.country[0] 
        : null
    }))
    
    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("[getAllProvinces] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getAllCities() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('cities')
      .select(`
        id,
        name,
        is_active,
        created_at,
        province:provinces(id, name)
      `)
      .order('name', { ascending: true })

    if (error) throw error
    
    const transformedData = (data || []).map(city => ({
      ...city,
      province: Array.isArray(city.province) && city.province.length > 0 
        ? city.province[0] 
        : null
    }))
    
    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("[getAllCities] Error:", error)
    return { success: false, error: error.message }
  }
}

export async function getAllNeighborhoods() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('neighborhoods')
      .select(`
        id,
        name,
        is_active,
        created_at,
        city:cities(id, name)
      `)
      .order('name', { ascending: true })

    if (error) throw error
    
    const transformedData = (data || []).map(neighborhood => ({
      ...neighborhood,
      city: Array.isArray(neighborhood.city) && neighborhood.city.length > 0 
        ? neighborhood.city[0] 
        : null
    }))
    
    return { success: true, data: transformedData }
  } catch (error: any) {
    console.error("[getAllNeighborhoods] Error:", error)
    return { success: false, error: error.message }
  }
}

// getById functions for edit pages
export async function getCountryById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("[getCountryById] Error:", error)
    return null
  }
}

export async function getCityById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("[getCityById] Error:", error)
    return null
  }
}

export async function getProvinceById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("[getProvinceById] Error:", error)
    return null
  }
}

export async function getNeighborhoodById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error("[getNeighborhoodById] Error:", error)
    return null
  }
}
