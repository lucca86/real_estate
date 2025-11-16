"use server"

import { createServerClient } from "@/lib/supabase/server"
import { hashPassword, getCurrentUser, hasPermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
    throw new Error("No tienes permisos para crear usuarios")
  }

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as "ADMIN" | "SUPERVISOR" | "VENDEDOR"
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const isActive = formData.get("isActive") === "on"

  if (!firstName || !lastName || !email || !password) {
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

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single()

  if (existingUser) {
    throw new Error("Ya existe un usuario con este email")
  }

  const hashedPassword = await hashPassword(password)

  const { error } = await supabase.from("users").insert({
    id: randomUUID(),
    first_name: firstName,
    last_name: lastName,
    email,
    role,
    password: hashedPassword,
    is_active: isActive,
  })

  if (error) throw error

  revalidatePath("/users")
}

export async function updateUser(userId: string, formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
    throw new Error("No tienes permisos para actualizar usuarios")
  }

  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as "ADMIN" | "SUPERVISOR" | "VENDEDOR"
  const isActive = formData.get("isActive") === "on"

  if (!firstName || !lastName || !email) {
    throw new Error("Nombre, apellido y email son requeridos")
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
    .single()

  if (existingUser) {
    throw new Error("Ya existe otro usuario con este email")
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      role,
      is_active: isActive,
    })
    .eq("id", userId)

  if (error) throw error

  revalidatePath("/users")
  revalidatePath(`/users/${userId}/edit`)
}

export async function deleteUser(userId: string) {
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
}
