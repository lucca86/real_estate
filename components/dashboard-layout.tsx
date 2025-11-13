"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import type { SessionUser } from "@/lib/auth"

interface DashboardLayoutProps {
  children: React.ReactNode
  user: SessionUser
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r">
        <AppSidebar user={user} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
            <AppSidebar user={user} />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
