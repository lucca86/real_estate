import { prisma } from "./db"
import { hash, compare } from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { authenticator } from "otplib"
import type { UserRole } from "@prisma/client"

const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production"

if (process.env.NODE_ENV === "production" && jwtSecret === "your-secret-key-change-in-production") {
  console.warn(
    "[v0] WARNING: Using default JWT_SECRET in production. Please set a secure JWT_SECRET environment variable!",
  )
}

const JWT_SECRET = new TextEncoder().encode(jwtSecret)

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function createSession(userId: string, userData: SessionUser): Promise<string> {
  try {
    const token = await new SignJWT({
      userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Try to save to database but don't fail if it's unreachable
    try {
      await prisma.session.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      })
    } catch (dbError) {
      // Database unreachable, continue with JWT-only auth
    }

    return token
  } catch (error) {
    console.error("[v0] createSession: Error creating session:", error)
    throw new Error("Failed to create session")
  }
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload

    const sessionUser: SessionUser = {
      id: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      avatar: payload.avatar as string | null | undefined,
    }

    return sessionUser
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    console.log("[v0] getCurrentUser: Starting")
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    console.log("[v0] getCurrentUser: Token present:", !!token)

    if (!token) {
      console.log("[v0] getCurrentUser: No token found")
      return null
    }

    const user = await verifySession(token)
    console.log("[v0] getCurrentUser: User verified:", !!user)
    return user
  } catch (error) {
    console.error("[v0] getCurrentUser: Error getting current user:", error)
    return null
  }
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { token },
    })
  } catch (error) {
    // Ignore database errors
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
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
