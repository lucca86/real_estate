"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { compare } from "bcryptjs"

async function findUserByEmail(email: string) {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id, email, password, isActive")
      .eq("email", email)
      .single()

    if (userError || !userData || !userData.isActive) {
      return null
    }

    return userData
  } catch (error) {
    console.error("[v0] findUserByEmail: Error during lookup:", error)
    return null
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
    const isValidPassword = await compare(password, user.password)

    if (!isValidPassword) {
      console.log("[v0] signIn: Invalid password")
      return { error: "Credenciales inválidas" }
    }

    const supabase = await createClient()

    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("id, email, password, isActive")
      .eq("email", email)
      .single()

    if (userError || !userData || !userData.isActive) {
      return { error: "Credenciales inválidas" }
    }

    const isValidPasswordSupabase = await compare(password, userData.password)

    if (!isValidPasswordSupabase) {
      return { error: "Credenciales inválidas" }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/dashboard`,
        },
      })

      if (signUpError) {
        console.error("[signIn] Error creating auth user:", signUpError)
        return { error: "Error al iniciar sesión" }
      }

      const { error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (retryError) {
        return { error: "Error al iniciar sesión" }
      }
    }

    console.log("[v0] signIn: Login successful, redirecting to dashboard")
    redirect("/dashboard")
  } catch (error) {
    console.error("[v0] signIn: Error during login:", error)

    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error
    }

    return { error: "Ocurrió un error al iniciar sesión. Por favor, intenta de nuevo." }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: userData } = await supabase
    .from("User")
    .select("id, email, name, role, avatar")
    .eq("id", user.id)
    .single()

  if (!userData) return null

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    avatar: userData.avatar,
  }
}
