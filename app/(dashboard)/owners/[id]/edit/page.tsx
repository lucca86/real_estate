import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { getOwnerById } from "@/lib/actions/owners"
import { OwnerForm } from "@/components/owner-form"

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params
  const result = await getOwnerById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <DashboardLayout user={user}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Editar Propietario</h1>
          <p className="text-muted-foreground">Actualiza la información del propietario</p>
        </div>
        <OwnerForm owner={result.data} />
      </div>
    </DashboardLayout>
  )
}
