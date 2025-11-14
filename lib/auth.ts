import { createClient } from "@/lib/supabase/server"
import { hash, compare } from "bcryptjs"
import { authenticator } from "otplib"
import type { UserRole } from "@prisma/client"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role, is_active")
      .eq("email", user.email)
      .single()

    if (userError || !userData || !userData.is_active) {
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role as UserRole,
    }
  } catch (error) {
    console.error("[getCurrentUser] Error:", error)
    return null
  }
}

// Permission helpers
export function hasPermission(user: SessionUser, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    ADMIN: 3,
    SUPERVISOR: 2,
    VENDEDOR: 1,
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === "ADMIN"
}

export function isSupervisor(user: SessionUser): boolean {
  return user.role === "SUPERVISOR" || user.role === "ADMIN"
}

// 2FA Functions
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret()
}

export function generateTwoFactorQRCode(email: string, secret: string): string {
  return authenticator.keyuri(email, "Real Estate Manager", secret)
}

export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch {
    return false
  }
}
