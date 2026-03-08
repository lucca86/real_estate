"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { compare } from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production"
)

async function findUserByEmail(email: string) {
  try {
    const supabase = await createClient()
    
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, password, role, is_active")
      .eq("email", email)
      .single()

    if (userError || !userData || !userData.is_active) {
      return null
    }

    return userData
  } catch (error) {
    console.error("[v0] findUserByEmail error:", error)
    return null
  }
}

export async function signIn(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Email y contraseña son requeridos" }
    }

    const user = await findUserByEmail(email)

    if (!user) {
      return { error: "Credenciales inválidas" }
    }
    
    const isValidPassword = await compare(password, user.password)

    if (!isValidPassword) {
      return { error: "Credenciales inválidas" }
    }

    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] signIn error:", error)
    return { error: "Ocurrió un error al iniciar sesión. Por favor, intenta de nuevo." }
  }
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  redirect("/login")
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    if (!token) return null

    const { jwtVerify } = await import("jose")
    const { payload } = await jwtVerify(token, JWT_SECRET)

    const supabase = await createClient()
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, name, role, is_active")
      .eq("id", payload.userId as string)
      .single()

    if (!userData || !userData.is_active) return null

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    }
  } catch (error) {
    return null
  }
}
