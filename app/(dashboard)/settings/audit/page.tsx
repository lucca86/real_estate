import { getCurrentUser, isAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuditLogViewer } from "@/components/audit-log-viewer"

export default async function AuditPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!isAdmin(user)) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Auditoría del Sistema</h1>
        <p className="text-muted-foreground">Visualiza todas las acciones realizadas en el sistema</p>
      </div>

      <AuditLogViewer />
    </div>
  )
}
