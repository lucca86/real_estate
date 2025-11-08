import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProvinceForm } from "@/components/province-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/db"

export default async function EditProvincePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [province, countries] = await Promise.all([
    prisma.province.findUnique({
      where: { id },
    }),
    prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!province) {
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Provincia</h1>
          <p className="text-muted-foreground">Modifica la información de la provincia</p>
        </div>

        <ProvinceForm province={province} countries={countries} />
      </div>
    </DashboardLayout>
  )
}
