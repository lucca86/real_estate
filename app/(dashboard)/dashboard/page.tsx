import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardStats } from "@/components/dashboard-stats"
import { RecentProperties } from "@/components/recent-properties"
import { PropertyStatusChart } from "@/components/property-status-chart"
import { RevenueChart } from "@/components/revenue-chart"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido de vuelta, {user.name}</p>
        </div>

        <DashboardStats />

        <div className="grid gap-6 md:grid-cols-2">
          <PropertyStatusChart />
          <RevenueChart />
        </div>

        <RecentProperties />
      </div>
    </DashboardLayout>
  )
}
