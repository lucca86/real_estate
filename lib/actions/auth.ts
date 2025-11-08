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
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const twoFactorCode = formData.get("twoFactorCode") as string | null

  if (!email || !password) {
    return { error: "Email y contraseña son requeridos" }
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.isActive) {
    return { error: "Credenciales inválidas" }
  }

  const isValidPassword = await verifyPassword(password, user.password)

  if (!isValidPassword) {
    return { error: "Credenciales inválidas" }
  }

  // Check 2FA if enabled
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    if (!twoFactorCode) {
      return { requiresTwoFactor: true }
    }

    const isValidToken = verifyTwoFactorToken(twoFactorCode, user.twoFactorSecret)

    if (!isValidToken) {
      return { error: "Código de autenticación inválido", requiresTwoFactor: true }
    }
  }

  const token = await createSession(user.id)
  await setSessionCookie(token)

  redirect("/dashboard")
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
