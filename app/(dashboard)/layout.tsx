import type React from "react"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  let user
  try {
    console.log("[v0] Dashboard Layout: Getting current user")
    user = await getCurrentUser()
    console.log("[v0] Dashboard Layout: User retrieved:", !!user)
  } catch (error) {
    console.error("[v0] Dashboard Layout: Error getting user:", error)
    redirect("/login")
  }

  if (!user) {
    console.log("[v0] Dashboard Layout: No user, redirecting to login")
    redirect("/login")
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
