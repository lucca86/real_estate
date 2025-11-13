import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OwnerForm } from "@/components/owner-form"

export default async function NewOwnerPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Propietario</h1>
        <p className="text-muted-foreground">Registra un nuevo propietario de propiedades</p>
      </div>
      <OwnerForm />
    </div>
  )
}
