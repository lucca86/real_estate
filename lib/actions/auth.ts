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
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

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

    const user = await prisma.user.findUnique({
      where: { email },
    })

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
    const token = await createSession(user.id)
    await setSessionCookie(token)

    console.log("[v0] signIn: Login successful, redirecting to dashboard")
    redirect("/dashboard")
  } catch (error) {
    console.error("[v0] signIn: Error during login:", error)

    // Check specific error types
    if (error instanceof Error) {
      // Handle redirect errors (these are expected)
      if (error.message.includes("NEXT_REDIRECT")) {
        throw error
      }

      // Log database connection errors
      if (error.message.includes("database") || error.message.includes("prisma")) {
        console.error("[v0] signIn: Database connection error:", error.message)
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
