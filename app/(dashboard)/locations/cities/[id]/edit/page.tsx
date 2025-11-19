import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { CityForm } from "@/components/city-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from 'lucide-react'
import Link from "next/link"
import { getCityById, getAllProvinces } from "@/lib/actions/locations"

export default async function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [city, provincesResult] = await Promise.all([
    getCityById(id),
    getAllProvinces(),
  ])

  if (!city) {
    notFound()
  }

  const provinces = provincesResult.success && provincesResult.data
    ? provincesResult.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        country: {
          name: p.country?.name || ''
        }
      }))
    : []

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
          <h1 className="text-3xl font-bold tracking-tight">Editar Ciudad</h1>
          <p className="text-muted-foreground">Modifica la información de la ciudad</p>
        </div>

        <CityForm 
          city={{
            id: city.id,
            name: city.name,
            provinceId: city.province_id,
            isActive: city.is_active
          }}
          provinces={provinces} 
        />
      </div>
    </DashboardLayout>
  )
}
