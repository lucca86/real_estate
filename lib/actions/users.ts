"use server"

import { createServerClient } from "@/lib/supabase/server"
import { hashPassword, getCurrentUser, hasPermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { put } from "@vercel/blob"

export async function createUser(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
      throw new Error("No tienes permisos para crear usuarios")
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as "ADMIN" | "SUPERVISOR" | "VENDEDOR"
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const isActive = formData.get("isActive") === "on"
    const avatarFile = formData.get("avatar") as File | null

    if (!name || !email || !password) {
      throw new Error("Todos los campos son requeridos")
    }

    if (password !== confirmPassword) {
      throw new Error("Las contraseñas no coinciden")
    }

    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres")
    }

    if (role === "ADMIN" && currentUser.role !== "ADMIN") {
      throw new Error("Solo los administradores pueden crear usuarios administradores")
    }

    const supabase = await createServerClient()
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).maybeSingle()

    if (existingUser) {
      throw new Error("Ya existe un usuario con este email")
    }

    let avatarUrl: string | null = null
    if (avatarFile && avatarFile.size > 0) {
      const blob = await put(`avatars/${randomUUID()}-${avatarFile.name}`, avatarFile, {
        access: "public",
      })
      avatarUrl = blob.url
    }

    const hashedPassword = await hashPassword(password)
    const newUser = {
      id: randomUUID(),
      name,
      email,
      role,
      password: hashedPassword,
      is_active: isActive,
      avatar: avatarUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("users").insert(newUser)
    if (error) {
      console.error("[v0] Supabase insert error:", error)
      throw error
    }

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    throw error
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
      throw new Error("No tienes permisos para actualizar usuarios")
    }

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as "ADMIN" | "SUPERVISOR" | "VENDEDOR"
    const isActive = formData.get("isActive") === "on"
    const avatarFile = formData.get("avatar") as File | null

    if (!name || !email) {
      throw new Error("Nombre y email son requeridos")
    }

    if (role === "ADMIN" && currentUser.role !== "ADMIN") {
      throw new Error("Solo los administradores pueden asignar el rol de administrador")
    }

    const supabase = await createServerClient()
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", userId)
      .maybeSingle()

    if (existingUser) {
      throw new Error("Ya existe otro usuario con este email")
    }

    let avatarUrl: string | null | undefined = undefined
    if (avatarFile && avatarFile.size > 0) {
      const blob = await put(`avatars/${randomUUID()}-${avatarFile.name}`, avatarFile, {
        access: "public",
      })
      avatarUrl = blob.url
    }

    const updateData: any = {
      name,
      email,
      role,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    if (avatarUrl !== undefined) {
      updateData.avatar = avatarUrl
    }

    const { error } = await supabase.from("users").update(updateData).eq("id", userId)

    if (error) throw error

    revalidatePath("/users")
    revalidatePath(`/users/${userId}/edit`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "ADMIN") {
      throw new Error("Solo los administradores pueden eliminar usuarios")
    }

    if (currentUser.id === userId) {
      throw new Error("No puedes eliminar tu propio usuario")
    }

    const supabase = await createServerClient()
    const { error } = await supabase.from("users").delete().eq("id", userId)
    if (error) throw error

    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    throw error
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createServerClient()
    const userId = formData.get("id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string
    const isActive = formData.get("is_active") === "true"
    const avatarFile = formData.get("avatar") as File | null

    let avatarUrl = null

    if (avatarFile && avatarFile.size > 0) {
      const blob = await put(`avatars/${userId}-${Date.now()}-${avatarFile.name}`, avatarFile, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      avatarUrl = blob.url
    }

    const updateData: Record<string, unknown> = {
      name,
      email,
      role,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    if (avatarUrl) {
      updateData.avatar = avatarUrl
    }

    const { error } = await supabase.from("users").update(updateData).eq("id", userId)

    if (error) {
      console.error("[v0] Error updating profile:", error)
      return { error: error.message }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error in updateProfile:", error)
    return { error: "Error al actualizar el perfil" }
  }
}
