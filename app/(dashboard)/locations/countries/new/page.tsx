import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CountryForm } from "@/components/country-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function NewCountryPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
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
          <h1 className="text-3xl font-bold tracking-tight">Nuevo País</h1>
          <p className="text-muted-foreground">Agrega un nuevo país al sistema</p>
        </div>

        <CountryForm />
      </div>
    </DashboardLayout>
  )
}
