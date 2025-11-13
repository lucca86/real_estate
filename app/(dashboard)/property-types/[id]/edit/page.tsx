import { getCurrentUser } from "@/lib/auth"
import { getPropertyTypeById } from "@/lib/actions/property-types"
import { redirect } from "next/navigation"
import { PropertyTypeForm } from "@/components/property-type-form"

export default async function EditPropertyTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const propertyType = await getPropertyTypeById(id)

  if (!propertyType) {
    redirect("/property-types")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Tipo de Propiedad</h1>
        <p className="text-muted-foreground">Modifica los datos del tipo de propiedad</p>
      </div>

      <PropertyTypeForm propertyType={propertyType} />
    </div>
  )
}
