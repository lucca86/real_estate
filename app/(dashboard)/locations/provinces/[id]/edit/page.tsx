import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProvinceForm } from "@/components/province-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from 'lucide-react'
import Link from "next/link"
import { getProvinceById, getAllCountries } from "@/lib/actions/locations"

export default async function EditProvincePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [province, countriesResult] = await Promise.all([
    getProvinceById(id),
    getAllCountries(),
  ])

  if (!province) {
    notFound()
  }

  const countries = countriesResult.success ? (countriesResult.data?.map((c: any) => ({
    id: c.id,
    name: c.name
  })) || []) : []

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/locations">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver a Ubicaciones
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Provincia</h1>
          <p className="text-muted-foreground">Modifica la información de la provincia</p>
        </div>

        <ProvinceForm 
          province={{
            id: province.id,
            name: province.name,
            countryId: province.country_id,
            isActive: province.is_active
          }}
          countries={countries} 
        />
      </div>
    </DashboardLayout>
  )
}
