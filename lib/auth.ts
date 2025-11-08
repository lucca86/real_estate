import { prisma } from "./db"
import { hash, compare } from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { authenticator } from "otplib"
import type { UserRole } from "@prisma/client"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

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

export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  return token
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const userId = verified.payload.userId as string

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      avatar: session.user.avatar,
    }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) {
    return null
  }

  return verifySession(token)
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({
    where: { token },
  })
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
