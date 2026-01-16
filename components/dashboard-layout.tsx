"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import type { SessionUser } from "@/lib/auth"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: SessionUser
  permissions?: Record<string, boolean>
}

export function DashboardLayout({ children, user, permissions }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r">
        <AppSidebar user={user} permissions={permissions} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-100 bg-black/80 md:hidden" onClick={closeSidebar} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-110 w-64 bg-background md:hidden">
            <AppSidebar user={user} permissions={permissions} onNavigate={closeSidebar} />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">{children}</main>
          <AppFooter />
        </div>
      </div>
    </div>
  )
}
