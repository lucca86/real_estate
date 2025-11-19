import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { OwnerForm } from "@/components/owner-form"
import { createServerClient } from "@/lib/supabase/server"

export default async function NewOwnerPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createServerClient()
  
  const [
    { data: countries },
    { data: provinces },
    { data: cities }
  ] = await Promise.all([
    supabase.from('countries').select('id, name').eq('is_active', true).order('name'),
    supabase.from('provinces').select('id, name, country_id').eq('is_active', true).order('name'),
    supabase.from('cities').select('id, name, province_id').eq('is_active', true).order('name')
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Propietario</h1>
        <p className="text-muted-foreground">Registra un nuevo propietario de propiedades</p>
      </div>
      <OwnerForm 
        countries={countries || []}
        provinces={provinces || []}
        cities={cities || []}
      />
    </div>
  )
}
