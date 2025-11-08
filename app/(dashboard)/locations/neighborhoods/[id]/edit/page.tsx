import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { NeighborhoodForm } from "@/components/neighborhood-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/db"

export default async function EditNeighborhoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const [neighborhood, cities] = await Promise.all([
    prisma.neighborhood.findUnique({
      where: { id },
    }),
    prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        province: { select: { name: true } },
      },
    }),
  ])

  if (!neighborhood) {
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Barrio</h1>
          <p className="text-muted-foreground">Modifica la información del barrio</p>
        </div>

        <NeighborhoodForm neighborhood={neighborhood} cities={cities} />
      </div>
    </DashboardLayout>
  )
}
