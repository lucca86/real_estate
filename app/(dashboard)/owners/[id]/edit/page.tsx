import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getOwnerById } from "@/lib/actions/owners"
import { OwnerForm } from "@/components/owner-form"
import { createAdminClient } from "@/lib/supabase/server"

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params
  const result = await getOwnerById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const ownerRaw = result.data

  const supabase = await createAdminClient()

  const defaultProvinceId = "f54e20b7-d5f8-4ae1-81f9-a09b2e2ee8f3"
  const provinceIdForCities = ownerRaw.province_id || defaultProvinceId

  const [{ data: countries }, { data: provinces }, { data: cities }] = await Promise.all([
    supabase.from("Country").select("id, name").eq("isActive", true).order("name"),
    supabase.from("Province").select("id, name, countryId").eq("isActive", true).order("name"),
    supabase.from("City").select("id, name, provinceId").eq("isActive", true).eq("provinceId", provinceIdForCities).order("name"),
  ])

  const owner = {
    ...ownerRaw,
    city: ownerRaw.city?.name || null,
    state: ownerRaw.province?.name || null,
    country: ownerRaw.country?.name || "",
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Propietario</h1>
        <p className="text-muted-foreground">Actualiza la información del propietario</p>
      </div>
      <OwnerForm owner={owner} countries={countries || []} provinces={provinces || []} cities={cities || []} />
    </div>
  )
}
