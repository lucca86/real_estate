import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProvinceForm } from "@/components/province-form"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { getCountries } from "@/lib/actions/locations"

export default async function NewProvincePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const countries = await getCountries()

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/locations">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a Ubicaciones
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Provincia</h1>
        <p className="text-muted-foreground">Agrega una nueva provincia al sistema</p>
      </div>

      <ProvinceForm countries={countries} />
    </div>
  )
}
