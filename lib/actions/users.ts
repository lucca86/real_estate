"use server"

import { prisma } from "@/lib/db"
import { hashPassword, getCurrentUser, hasPermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
    throw new Error("No tienes permisos para crear usuarios")
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as "ADMIN" | "SUPERVISOR" | "VENDEDOR"
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const isActive = formData.get("isActive") === "on"

  if (!name || !email || !password) {
    throw new Error("Todos los campos son requeridos")
  }

  if (password !== confirmPassword) {
    throw new Error("Las contraseñas no coinciden")
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres")
  }

  // Only admins can create admin users
  if (role === "ADMIN" && currentUser.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden crear usuarios administradores")
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("Ya existe un usuario con este email")
  }

  const hashedPassword = await hashPassword(password)

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      role,
      password: hashedPassword,
      isActive,
    },
  })

  revalidatePath("/users")
}

export async function updateUser(userId: string, formData: FormData) {
  const currentUser = await getCurrentUser()

  if (!currentUser || !hasPermission(currentUser, "SUPERVISOR")) {
    throw new Error("No tienes permisos para actualizar usuarios")
  }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as "ADMIN" | "SUPERVISOR" | "VENDEDOR"
  const isActive = formData.get("isActive") === "on"

  if (!name || !email) {
    throw new Error("Nombre y email son requeridos")
  }

  // Only admins can change roles to admin
  if (role === "ADMIN" && currentUser.role !== "ADMIN") {
    throw new Error("Solo los administradores pueden asignar el rol de administrador")
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: { id: userId },
    },
  })

  if (existingUser) {
    throw new Error("Ya existe otro usuario con este email")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      phone: phone || null,
      role,
      isActive,
    },
  })

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

  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath("/users")
}
