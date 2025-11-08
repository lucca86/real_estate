import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientForm } from "@/components/client-form"

export default async function NewClientPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout user={user}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Registra un nuevo cliente potencial</p>
        </div>

        <ClientForm />
      </div>
    </DashboardLayout>
  )
}
