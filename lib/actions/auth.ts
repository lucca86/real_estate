"use server"

import { prisma } from "@/lib/db"
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
  verifyTwoFactorToken,
} from "@/lib/auth"
import { redirect } from 'next/navigation'
import { cookies } from "next/headers"
import { neon } from '@neondatabase/serverless'

async function findUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
    })
  } catch (prismaError) {
    console.error("[v0] Prisma query failed, trying direct SQL:", prismaError)
    
    try {
      const databaseUrl = 
        process.env.DATABASE_URL ||
        process.env.real_estate_DATABASE_URL ||
        process.env.POSTGRES_URL ||
        process.env.real_estate_POSTGRES_URL
      
      if (!databaseUrl) {
        throw new Error("No database URL found")
      }
      
      const sql = neon(databaseUrl)
      const users = await sql`
        SELECT * FROM "User" WHERE email = ${email} LIMIT 1
      `
      
      if (users.length === 0) return null
      
      const user = users[0]
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      }
    } catch (sqlError) {
      console.error("[v0] Direct SQL also failed:", sqlError)
      throw prismaError // Throw original error
    }
  }
}

export async function signIn(formData: FormData) {
  try {
    console.log("[v0] signIn: Starting login process")

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const twoFactorCode = formData.get("twoFactorCode") as string | null

    if (!email || !password) {
      console.log("[v0] signIn: Missing email or password")
      return { error: "Email y contraseña son requeridos" }
    }

    console.log("[v0] signIn: Looking up user with email:", email)

    const user = await findUserByEmail(email)

    if (!user || !user.isActive) {
      console.log("[v0] signIn: User not found or inactive")
      return { error: "Credenciales inválidas" }
    }

    console.log("[v0] signIn: Verifying password")
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      console.log("[v0] signIn: Invalid password")
      return { error: "Credenciales inválidas" }
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        console.log("[v0] signIn: 2FA required but not provided")
        return { requiresTwoFactor: true }
      }

      const isValidToken = verifyTwoFactorToken(twoFactorCode, user.twoFactorSecret)

      if (!isValidToken) {
        console.log("[v0] signIn: Invalid 2FA code")
        return { error: "Código de autenticación inválido", requiresTwoFactor: true }
      }
    }

    console.log("[v0] signIn: Creating session")
    const token = await createSession(user.id, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    })
    await setSessionCookie(token)

    console.log("[v0] signIn: Login successful, redirecting to dashboard")
    redirect("/dashboard")
  } catch (error) {
    console.error("[v0] signIn: Error during login:", error)

    if (error instanceof Error) {
      console.error("[v0] signIn: Error type:", error.constructor.name)
      console.error("[v0] signIn: Error message:", error.message)
      console.error("[v0] signIn: Error stack:", error.stack)
      
      if (error.message.includes("NEXT_REDIRECT")) {
        throw error
      }

      if (
        error.message.includes("database") || 
        error.message.includes("prisma") ||
        error.message.includes("connect") ||
        error.message.includes("timeout")
      ) {
        console.error("[v0] signIn: Database connection error detected")
        return { error: "Error de conexión a la base de datos. Por favor, intenta de nuevo." }
      }
    }

    return { error: "Ocurrió un error al iniciar sesión. Por favor, intenta de nuevo." }
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (token) {
    await prisma.session
      .delete({
        where: { token },
      })
      .catch(() => {})
  }

  await clearSessionCookie()
  redirect("/login")
}

export async function getSession() {
  return getCurrentUser()
}
