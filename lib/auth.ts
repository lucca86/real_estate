import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { hash, compare } from "bcryptjs"
import { authenticator } from "otplib"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
)

export interface SessionUser {
  id: string
  email: string
  name: string
  role: "ADMIN" | "SUPERVISOR" | "VENDEDOR"
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
      .from("User")
      .select("id, email, name, role, isActive")
      .eq("id", payload.userId as string)
      .eq("isActive", true)
      .single()

    if (userError || !userData) {
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role as "ADMIN" | "SUPERVISOR" | "VENDEDOR",
    }
  } catch (error) {
    console.error("[getCurrentUser] Error:", error)
    return null
  }
}

// Permission helpers
export function hasPermission(user: SessionUser, requiredRole: "ADMIN" | "SUPERVISOR" | "VENDEDOR"): boolean {
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
