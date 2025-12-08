import { getCurrentUser } from "@/lib/auth"
import { checkPermission } from "@/lib/permissions"
import { DocumentationViewer } from "@/components/documentation-viewer"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Documentación del Sistema - Gestión Inmobiliaria RE",
  description: "Manual completo y guía de usuario del sistema",
}

export default async function DocumentationPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const userPermissions = {
    canViewAll: user.role === "ADMIN" || user.role === "SUPERVISOR",
    canManageProperties: await checkPermission("properties.create"),
    canManageClients: await checkPermission("clients.create"),
    canManageAppointments: await checkPermission("appointments.create"),
    canManageUsers: await checkPermission("users.manage"),
    canManageSettings: await checkPermission("settings.view"),
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Documentación del Sistema</h1>
        <p className="mt-2 text-muted-foreground">Manual completo y guía de usuario de Gestión Inmobiliaria RE</p>
      </div>

      <DocumentationViewer userPermissions={userPermissions} userRole={user.role} />
    </div>
  )
}
