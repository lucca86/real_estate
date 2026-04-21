"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

// Country actions
export async function createCountry(formData: FormData) {
  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !code) throw new Error("Nombre y código son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("countries")
      .insert({ id: crypto.randomUUID(), name, code: code.toUpperCase(), is_active: isActive })
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al crear el país")
  }
}

export async function updateCountry(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !code) throw new Error("Nombre y código son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("countries")
      .update({ name, code: code.toUpperCase(), is_active: isActive })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al actualizar el país")
  }
}

// Province actions
export async function createProvince(formData: FormData) {
  const name = formData.get("name") as string
  const countryId = formData.get("countryId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !countryId) throw new Error("Nombre y país son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("provinces")
      .insert({ id: crypto.randomUUID(), name, country_id: countryId, is_active: isActive })
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al crear la provincia")
  }
}

export async function updateProvince(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const countryId = formData.get("countryId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !countryId) throw new Error("Nombre y país son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("provinces")
      .update({ name, country_id: countryId, is_active: isActive })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al actualizar la provincia")
  }
}

// City actions
export async function createCity(formData: FormData) {
  const name = formData.get("name") as string
  const provinceId = formData.get("provinceId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !provinceId) throw new Error("Nombre y provincia son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("cities")
      .insert({ id: crypto.randomUUID(), name, province_id: provinceId, is_active: isActive })
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al crear la ciudad")
  }
}

export async function updateCity(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const provinceId = formData.get("provinceId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !provinceId) throw new Error("Nombre y provincia son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("cities")
      .update({ name, province_id: provinceId, is_active: isActive })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al actualizar la ciudad")
  }
}

// Neighborhood actions
export async function createNeighborhood(formData: FormData) {
  const name = formData.get("name") as string
  const cityId = formData.get("cityId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !cityId) throw new Error("Nombre y ciudad son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("neighborhoods")
      .insert({ id: crypto.randomUUID(), name, city_id: cityId, is_active: isActive })
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al crear el barrio")
  }
}

export async function updateNeighborhood(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const cityId = formData.get("cityId") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !cityId) throw new Error("Nombre y ciudad son requeridos")

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("neighborhoods")
      .update({ name, city_id: cityId, is_active: isActive })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    revalidatePath("/locations")
    return data
  } catch (error: any) {
    throw new Error(error.message || "Error al actualizar el barrio")
  }
}

export async function getNeighborhoods(cityId: string) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("neighborhoods")
      .select("id, name")
      .eq("city_id", cityId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export const getCitiesByProvince = getCities
export const getNeighborhoodsByCity = getNeighborhoods

export async function deleteLocation(type: "country" | "province" | "city" | "neighborhood", id: string) {
  try {
    const supabase = await createAdminClient()
    const tableMap: Record<string, string> = {
      country: "countries",
      province: "provinces",
      city: "cities",
      neighborhood: "neighborhoods",
    }

    const { error } = await supabase.from(tableMap[type] as any).delete().eq("id", id)

    if (error) {
      if (error.code === "23503") {
        const { error: updateError } = await supabase
          .from(tableMap[type] as any)
          .update({ is_active: false })
          .eq("id", id)

        if (updateError) throw updateError

        revalidatePath("/locations")
        return {
          success: true,
          wasDeactivated: true,
          message: `No se puede eliminar porque tiene registros asociados. Se marcó como inactivo.`,
        }
      }
      throw error
    }

    revalidatePath("/locations")
    return { success: true, wasDeactivated: false }
  } catch (error: any) {
    return { success: false, error: error.message || `Error al eliminar el ${type}` }
  }
}

export async function getCountries() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("countries")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export async function getProvinces(countryId: string) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("provinces")
      .select("id, name")
      .eq("country_id", countryId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export async function getCities(provinceId: string) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("cities")
      .select("id, name")
      .eq("province_id", provinceId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export async function getAllCountries() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("countries")
      .select("id, name, code, is_active, created_at")
      .order("name", { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllProvinces() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("provinces")
      .select(`
        id, name, is_active, created_at, country_id,
        country:countries!provinces_country_id_fkey(id, name)
      `)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllCities() {
  try {
    const supabase = await createAdminClient()
    const { data: cities, error } = await supabase
      .from("cities")
      .select(`
        id, name, is_active,
        province:provinces!cities_province_id_fkey(
          id, name,
          country:countries!provinces_country_id_fkey(id, name)
        )
      `)
      .eq("is_active", true)

    if (error) throw error
    if (!cities) return []

    return cities
      .map((city: any) => {
        const provinceData = Array.isArray(city.province) ? city.province[0] : city.province
        if (!provinceData) return null
        const countryData = Array.isArray(provinceData.country) ? provinceData.country[0] : provinceData.country
        if (!countryData) return null

        return {
          id: city.id,
          name: city.name,
          countryId: countryData.id,
          province: {
            id: provinceData.id,
            name: provinceData.name,
            country: { id: countryData.id, name: countryData.name },
          },
        }
      })
      .filter(Boolean)
  } catch (error: any) {
    throw new Error(error.message || "Error al obtener las ciudades")
  }
}

export async function getAllNeighborhoods() {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from("neighborhoods")
      .select(`
        id, name, is_active, created_at,
        city:cities!neighborhoods_city_id_fkey(id, name)
      `)
      .order("name", { ascending: true })

    if (error) throw error

    const transformedData = (data || []).map((neighborhood: any) => ({
      ...neighborhood,
      city: Array.isArray(neighborhood.city) && neighborhood.city.length > 0 ? neighborhood.city[0] : null,
    }))

    return { success: true, data: transformedData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getCountryById(id: string) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from("countries").select("*").eq("id", id).single()
    if (error) throw error
    return data
  } catch { return null }
}

export async function getCityById(id: string) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from("cities").select("*").eq("id", id).single()
    if (error) throw error
    return data
  } catch { return null }
}

export async function getProvinceById(id: string) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from("provinces").select("*").eq("id", id).single()
    if (error) throw error
    return data
  } catch { return null }
}

export async function getNeighborhoodById(id: string) {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.from("neighborhoods").select("*").eq("id", id).single()
    if (error) throw error
    return data
  } catch { return null }
}

export async function checkCityExists(name: string, provinceId: string, excludeId?: string) {
  try {
    const supabase = await createAdminClient()
    let query = supabase.from("cities").select("id, name").eq("province_id", provinceId).ilike("name", name)
    if (excludeId) query = query.neq("id", excludeId)
    const { data, error } = await query
    if (error) throw error
    return { exists: (data || []).length > 0, matches: data || [] }
  } catch {
    return { exists: false, matches: [] }
  }
}

export async function checkNeighborhoodExists(name: string, cityId: string, excludeId?: string) {
  try {
    const supabase = await createAdminClient()
    let query = supabase.from("neighborhoods").select("id, name").eq("city_id", cityId).ilike("name", name)
    if (excludeId) query = query.neq("id", excludeId)
    const { data, error } = await query
    if (error) throw error
    return { exists: (data || []).length > 0, matches: data || [] }
  } catch {
    return { exists: false, matches: [] }
  }
}

export async function checkDuplicateNeighborhood(name: string, cityId: string, excludeId?: string) {
  try {
    const supabase = await createAdminClient()
    let query = supabase.from("neighborhoods").select("id, name").eq("city_id", cityId).ilike("name", name).eq("is_active", true)
    if (excludeId) query = query.neq("id", excludeId)
    const { data, error } = await query
    if (error) return false
    return data && data.length > 0
  } catch { return false }
}

export async function checkDuplicateCity(name: string, provinceId: string, excludeId?: string) {
  try {
    const supabase = await createAdminClient()
    let query = supabase.from("cities").select("id, name").eq("province_id", provinceId).ilike("name", name).eq("is_active", true)
    if (excludeId) query = query.neq("id", excludeId)
    const { data, error } = await query
    if (error) return false
    return data && data.length > 0
  } catch { return false }
}

export async function checkDuplicateProvince(name: string, countryId: string, excludeId?: string) {
  try {
    const supabase = await createAdminClient()
    let query = supabase.from("provinces").select("id, name").eq("country_id", countryId).ilike("name", name).eq("is_active", true)
    if (excludeId) query = query.neq("id", excludeId)
    const { data, error } = await query
    if (error) return false
    return data && data.length > 0
  } catch { return false }
}
