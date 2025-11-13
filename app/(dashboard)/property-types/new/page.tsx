import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PropertyTypeForm } from "@/components/property-type-form"

export default async function NewPropertyTypePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Tipo de Propiedad</h1>
        <p className="text-muted-foreground">Crea un nuevo tipo de propiedad</p>
      </div>

      <PropertyTypeForm />
    </div>
  )
}
