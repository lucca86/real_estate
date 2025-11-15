import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { hash, compare } from "bcryptjs"
import { authenticator } from "otplib"
import type { UserRole } from "@prisma/client"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
)

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
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role, is_active")
      .eq("id", payload.userId as string)
      .eq("is_active", true)
      .single()

    if (userError || !userData) {
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
