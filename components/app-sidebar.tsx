"use client"
import {
  Building2,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Search,
  Settings,
  Users,
  UserCircle,
  Calendar,
  Tag,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"
import type { SessionUser } from "@/lib/auth"

interface AppSidebarProps {
  user: SessionUser
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Propiedades",
      href: "/properties",
      icon: Building2,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Tipos de Propiedad",
      href: "/property-types",
      icon: Tag,
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      name: "Catálogo",
      href: "/catalog",
      icon: Search,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Mapa",
      href: "/map",
      icon: Map,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Propietarios",
      href: "/owners",
      icon: Home,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Clientes",
      href: "/clients",
      icon: UserCircle,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Citas",
      href: "/appointments",
      icon: Calendar,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Usuarios",
      href: "/users",
      icon: Users,
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      name: "Configuración",
      href: "/settings",
      icon: Settings,
      roles: ["ADMIN"],
    },
  ]

  const filteredNavigation = navigation.filter((item) => item.roles.includes(user.role))

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Home className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">Real Estate</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
