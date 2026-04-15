import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { OwnerForm } from "@/components/owner-form"
import { createAdminClient } from "@/lib/supabase/server"

export default async function NewOwnerPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createAdminClient()

  const defaultProvinceId = "f54e20b7-d5f8-4ae1-81f9-a09b2e2ee8f3"

  const [
    { data: countries },
    { data: provinces },
    { data: cities }
  ] = await Promise.all([
    supabase.from("Country").select("id, name").eq("isActive", true).order("name"),
    supabase.from("Province").select("id, name, countryId").eq("isActive", true).order("name"),
    supabase.from("City").select("id, name, provinceId").eq("isActive", true).eq("provinceId", defaultProvinceId).order("name"),
  ])

  // Normalize to snake_case for the OwnerForm which expects country_id / province_id
  const normalizedProvinces = (provinces || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    country_id: p.countryId ?? p.country_id ?? null,
    countryId: p.countryId ?? p.country_id ?? null,
  }))
  const normalizedCities = (cities || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    province_id: c.provinceId ?? c.province_id ?? null,
    provinceId: c.provinceId ?? c.province_id ?? null,
  }))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Propietario</h1>
        <p className="text-muted-foreground">Registra un nuevo propietario de propiedades</p>
      </div>
      <OwnerForm 
        countries={countries || []}
        provinces={normalizedProvinces}
        cities={normalizedCities}
      />
    </div>
  )
}
