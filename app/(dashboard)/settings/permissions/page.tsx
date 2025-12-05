import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PermissionsManager } from "@/components/permissions-manager"

export default async function PermissionsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administración de Permisos</h1>
        <p className="text-muted-foreground mt-2">Configura los permisos para cada rol del sistema</p>
      </div>

      <PermissionsManager />
    </div>
  )
}
