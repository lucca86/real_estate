"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const requestResetSchema = z.object({
  email: z.string().email("Email inválido"),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type PasswordResetResult = { error: string } | { success: true; message: string; resetUrl?: string }

type ResetPasswordResult = { error: string } | { success: true; message: string }

type ChangePasswordResult = { error: string } | { success: true; message: string }

export async function requestPasswordReset(formData: FormData): Promise<PasswordResetResult> {
  try {
    const validatedFields = requestResetSchema.safeParse({
      email: formData.get("email"),
    })

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors.email?.[0] || "Datos inválidos",
      }
    }

    const { email } = validatedFields.data
    const supabase = await createClient()

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .single()

    // Always return success even if user not found (security best practice)
    if (userError || !user) {
      return {
        success: true,
        message: "Si el email existe, recibirás un enlace de recuperación",
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to database
    const { error: tokenError } = await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      console.error("[v0] Error creating reset token:", tokenError)
      return { error: "Error al crear el token de recuperación" }
    }

    // Send email with reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3001"}/reset-password?token=${token}`

    // TODO: Implement email sending here (use a service like Resend or SendGrid)

    return {
      success: true,
      message: "Si el email existe, recibirás un enlace de recuperación",
      // In development, return the token for testing
      ...(process.env.NODE_ENV === "development" && { resetUrl }),
    }
  } catch (error) {
    console.error("[v0] Error in requestPasswordReset:", error)
    return { error: "Error al procesar la solicitud" }
  }
}

export async function resetPassword(formData: FormData): Promise<ResetPasswordResult> {
  try {
    const validatedFields = resetPasswordSchema.safeParse({
      token: formData.get("token"),
      password: formData.get("password"),
    })

    if (!validatedFields.success) {
      return {
        error: "Datos inválidos",
      }
    }

    const { token, password } = validatedFields.data
    const supabase = await createClient()

    // Find valid token
    const { data: resetToken, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (tokenError || !resetToken) {
      return { error: "Token inválido o expirado" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", resetToken.user_id)

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return { error: "Error al actualizar la contraseña" }
    }

    // Mark token as used
    await supabase.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", resetToken.id)

    return {
      success: true,
      message: "Contraseña actualizada exitosamente",
    }
  } catch (error) {
    console.error("[v0] Error in resetPassword:", error)
    return { error: "Error al procesar la solicitud" }
  }
}

export async function changePassword(formData: FormData): Promise<ChangePasswordResult> {
  try {
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string

    if (!currentPassword || !newPassword) {
      return { error: "Todos los campos son requeridos" }
    }

    if (newPassword.length < 6) {
      return { error: "La nueva contraseña debe tener al menos 6 caracteres" }
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) {
      return { error: "Usuario no autenticado" }
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("password")
      .eq("id", authUser.id)
      .single()

    if (userError || !user) {
      return { error: "Usuario no encontrado" }
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return { error: "Contraseña actual incorrecta" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", authUser.id)

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return { error: "Error al actualizar la contraseña" }
    }

    return {
      success: true,
      message: "Contraseña actualizada exitosamente",
    }
  } catch (error) {
    console.error("[v0] Error in changePassword:", error)
    return { error: "Error al procesar la solicitud" }
  }
}
