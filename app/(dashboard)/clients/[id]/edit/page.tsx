import { getCurrentUser } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientForm } from "@/components/client-form"
import { getClientById } from "@/lib/actions/clients"

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params
  const result = await getClientById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const client = result.data

  return (
    <DashboardLayout user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
          <p className="text-muted-foreground">Actualiza la información del cliente</p>
        </div>

        <ClientForm client={client} />
      </div>
    </DashboardLayout>
  )
}
