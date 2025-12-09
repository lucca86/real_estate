import type React from "react"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { checkPermissions } from "@/lib/permissions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const permissions = await checkPermissions([
    "catalog.view",
    "dashboard.view",
    "properties.view",
    "property_types.view",
    "map.view",
    "owners.view",
    "clients.view",
    "contacts.view",
    "services.view",
    "appointments.view",
    "users.view",
    "locations.view",
    "settings.view",
  ])

  return (
    <DashboardLayout user={user} permissions={permissions}>
      {children}
    </DashboardLayout>
  )
}
