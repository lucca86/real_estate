"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/actions/auth"
import type { SessionUser } from "@/lib/auth"
import Link from "next/link"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { APP_VERSION } from "@/lib/version"

interface AppHeaderProps {
  user: SessionUser
  onMenuClick?: () => void
}

export function AppHeader({ user, onMenuClick }: AppHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const userName = user?.name || "Usuario"
  const userEmail = user?.email || "email@example.com"
  const userInitials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  const logoSrc =
    mounted && (resolvedTheme === "dark" || theme === "dark") ? "/images/logo-dark.png" : "/images/logo-light.png"

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <Link href="/dashboard" className="flex items-center gap-3">
        {mounted && (
          <Image
            src={logoSrc || "/placeholder.svg"}
            alt="Gestión Inmobiliaria"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
        )}
        <span className="hidden sm:inline-flex items-baseline gap-2 text-lg font-semibold text-foreground">
          Gestión Inmobiliaria RE
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full leading-none tracking-wide">
            v{APP_VERSION}
          </span>
        </span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User menu */}
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} alt={userName} />
                <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}/edit`}>Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="ghost" className="flex items-center gap-2 h-auto py-2 px-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || undefined} alt={userName} />
            <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block">{userName}</span>
        </Button>
      )}
    </header>
  )
}
