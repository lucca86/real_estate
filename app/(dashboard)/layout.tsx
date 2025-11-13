import type React from "react"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
