"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { hashPassword, getCurrentUser, hasPermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { put } from "@vercel/blob"
import { logAudit } from "@/lib/audit"
import { serverLog } from "@/lib/server-log"

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

    const supabase = await createAdminClient()
    const { data: existingUser } = await supabase.from("User").select("id").eq("email", email).maybeSingle()

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
      isActive,
      avatar: avatarUrl,
    }

    const { error } = await supabase.from("User").insert(newUser)
    if (error) {
      serverLog.error("Supabase insert error:", error)
      throw error
    }

    await logAudit({
      module: "users",
      action: "create",
      entity_type: "Usuario",
      entity_id: newUser.id,
      metadata: { name: newUser.name, email: newUser.email, role: newUser.role },
    })
    revalidatePath("/users")
    return { success: true }
  } catch (error) {
    serverLog.error("Error creating user:", error)
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

    const supabase = await createAdminClient()
    const { data: existingUser } = await supabase
      .from("User")
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
      isActive,
    }

    if (avatarUrl !== undefined) {
      updateData.avatar = avatarUrl
    }

    const { error } = await supabase.from("User").update(updateData).eq("id", userId)

    if (error) throw error

    await logAudit({
      module: "users",
      action: "update",
      entity_type: "Usuario",
      entity_id: userId,
      metadata: { name, email, role },
    })
    revalidatePath("/users")
    revalidatePath(`/users/${userId}/edit`)
    return { success: true }
  } catch (error) {
    serverLog.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Solo los administradores pueden eliminar usuarios" }
    }

    if (currentUser.id === userId) {
      return { success: false, error: "No puedes eliminar tu propio usuario" }
    }

    const supabase = await createAdminClient()
    const { error } = await supabase.from("User").delete().eq("id", userId)

    if (error) {
      if (error.code === "23503") {
        const { error: updateError } = await supabase
          .from("User")
          .update({ isActive: false })
          .eq("id", userId)

        if (updateError) throw updateError

        revalidatePath("/users")
        return {
          success: true,
          wasDeactivated: true,
          message: `No se puede eliminar el usuario porque tiene registros asociados. Se marcó como inactivo.`,
        }
      }
      throw error
    }

    await logAudit({
      module: "users",
      action: "delete",
      entity_type: "Usuario",
      entity_id: userId,
    })
    revalidatePath("/users")
    return { success: true, wasDeactivated: false }
  } catch (error: any) {
    serverLog.error("Error deleting user:", error)
    return { success: false, error: error.message || "Error al eliminar usuario" }
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createAdminClient()
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
      isActive,
    }

    if (avatarUrl) {
      updateData.avatar = avatarUrl
    }

    const { error } = await supabase.from("User").update(updateData).eq("id", userId)

    if (error) {
      serverLog.error("Error updating profile:", error)
      return { error: error.message }
    }

    revalidatePath("/profile")
    return { success: true }
  } catch (error) {
    serverLog.error("Error in updateProfile:", error)
    return { error: "Error al actualizar el perfil" }
  }
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ error: string } | { success: true; message: string }> {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || (currentUser.id !== userId && currentUser.role !== "ADMIN")) {
      return { error: "No tienes permisos para cambiar esta contraseña" }
    }

    if (newPassword.length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres" }
    }

    const supabase = await createAdminClient()

    if (currentUser.id === userId) {
      const { data: user } = await supabase.from("User").select("password").eq("id", userId).single()

      if (!user) {
        return { error: "Usuario no encontrado" }
      }

      const bcrypt = await import("bcryptjs")
      const isValid = await bcrypt.compare(currentPassword, user.password)

      if (!isValid) {
        return { error: "La contraseña actual es incorrecta" }
      }
    }

    const hashedPassword = await hashPassword(newPassword)

    const { error } = await supabase
      .from("User")
      .update({ password: hashedPassword })
      .eq("id", userId)

    if (error) {
      serverLog.error("Error updating password:", error)
      return { error: "Error al actualizar la contraseña" }
    }

    revalidatePath(`/users/${userId}/edit`)
    return { success: true, message: "Contraseña actualizada exitosamente" }
  } catch (error) {
    serverLog.error("Error in changeUserPassword:", error)
    return { error: "Error al cambiar la contraseña" }
  }
}
