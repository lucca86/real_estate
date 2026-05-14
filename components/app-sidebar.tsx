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
  MapPin,
  BookUser,
  Wrench,
  DatabaseBackup,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"
import { APP_VERSION } from "@/lib/version"
import type { SessionUser } from "@/lib/auth"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { getRoleLabel } from "@/lib/role-labels"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  roles?: string[]
  permission?: string
  children?: Omit<NavItem, "children">[]
}

interface AppSidebarProps {
  user: SessionUser | null
  permissions?: Record<string, boolean>
  onNavigate?: () => void
}

export function AppSidebar({ user, permissions = {}, onNavigate }: AppSidebarProps) {
  const pathname = usePathname()
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigation: NavItem[] = [
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
      name: "Características y Amenidades",
      href: "/property-features",
      icon: Tag,
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      name: "Catálogo",
      href: "/catalog",
      icon: Search,
      permission: "catalog.view",
    },
    {
      name: "Mapa",
      href: "/map",
      icon: Map,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Propietarios / Intermediarios",
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
      name: "Agenda de Contactos",
      href: "/contacts",
      icon: BookUser,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Servicios",
      href: "/services",
      icon: Wrench,
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      name: "Citas",
      href: "/appointments",
      icon: Calendar,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Ubicaciones",
      href: "/locations",
      icon: MapPin,
      roles: ["ADMIN", "SUPERVISOR"],
    },
    {
      name: "Documentación",
      href: "/documentation",
      icon: BookUser,
      roles: ["ADMIN", "SUPERVISOR", "VENDEDOR"],
    },
    {
      name: "Configuración",
      href: "/settings",
      icon: Settings,
      roles: ["ADMIN", "SUPERVISOR"],
      children: [
        {
          name: "Usuarios",
          href: "/users",
          icon: Users,
          roles: ["ADMIN", "SUPERVISOR"],
        },
        {
          name: "Herramientas",
          href: "/settings/tools",
          icon: DatabaseBackup,
          roles: ["ADMIN"],
        },
      ],
    },
  ]

  function canAccess(item: Omit<NavItem, "children">): boolean {
    if (!user) return false
    if (item.permission) return permissions[item.permission] === true
    if (item.roles) return item.roles.includes(user.role)
    return false
  }

  const filteredNavigation = navigation
    .filter((item) => canAccess(item))
    .map((item) => ({
      ...item,
      children: item.children?.filter(canAccess),
    }))

  const handleSignOut = async () => {
    await signOut()
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  const currentTheme = mounted ? resolvedTheme : "light"
  const logoSrc = currentTheme === "dark" ? "/images/logo-dark.png" : "/images/logo-light.webp"

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        {mounted && (
          <Image
            src={logoSrc || "/placeholder.svg"}
            alt="Gestión Inmobiliaria RE"
            width={200}
            height={40}
            className="h-10 object-contain"
            style={{ width: 'auto' }}
            priority
          />
        )}
        {!mounted && <div className="h-10 w-[200px]" />}
        <span className="ml-auto text-[10px] font-medium text-sidebar-foreground/40 leading-none">
          v{APP_VERSION}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const hasChildren = item.children && item.children.length > 0
          // Auto-expand if current path is under this group
          const isGroupExpanded = hasChildren && (
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            item.children!.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
          )

          if (hasChildren) {
            return (
              <div key={item.name}>
                {/* Parent link — navigates to /settings and visually shows group */}
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      isGroupExpanded && "rotate-90",
                    )}
                  />
                </Link>

                {/* Children — shown when group is active */}
                {isGroupExpanded && (
                  <div className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-3">
                    {item.children!.map((child) => {
                      const childActive = pathname === child.href || pathname.startsWith(child.href + "/")
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                            childActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <child.icon className="h-4 w-4 shrink-0" />
                          <span>{child.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        {user && (
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 shrink-0 hover:bg-sidebar-primary/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
