import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CityForm } from "@/components/city-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/db"

export default async function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [city, provinces] = await Promise.all([
    prisma.city.findUnique({
      where: { id },
    }),
    prisma.province.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        country: { select: { name: true } },
      },
    }),
  ])

  if (!city) {
    notFound()
  }

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

        <CityForm city={city} provinces={provinces} />
      </div>
    </DashboardLayout>
  )
}
