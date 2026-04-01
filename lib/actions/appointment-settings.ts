"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types/action-result"

export interface AppointmentSetting {
  id: string
  day_type: "WEEKDAY" | "SATURDAY" | "HOLIDAY"
  is_open: boolean
  start_time: string | null
  end_time: string | null
  min_duration: number
  max_duration: number
  duration_interval: number
}

export async function getAppointmentSettings(): Promise<AppointmentSetting[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("appointment_settings")
    .select("*")
    .order("day_type")

  if (error) {
    console.error("Error fetching appointment settings:", error)
    return []
  }

  return data || []
}

export async function updateAppointmentSetting(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createAdminClient()

  // Verificar autenticación y rol usando getCurrentUser
  const user = await getCurrentUser()
  
  if (!user) {
    console.error("[v0] ✗ No authenticated user")
    return {
      success: false,
      error: "No estás autenticado",
    }
  }

  // Verificar permisos (solo ADMIN y SUPERVISOR pueden gestionar configuración)
  const canManage = hasPermission(user, "SUPERVISOR")
  
  if (!canManage) {
    return {
      success: false,
      error: "No tienes permisos para actualizar la configuración",
    }
  }

  const is_open = formData.get("is_open") === "true"
  const start_time = formData.get("start_time") as string | null
  const end_time = formData.get("end_time") as string | null
  const min_duration = Number.parseInt(formData.get("min_duration") as string)
  const max_duration = Number.parseInt(formData.get("max_duration") as string)
  const duration_interval = Number.parseInt(formData.get("duration_interval") as string)

  // Validaciones
  if (is_open && (!start_time || !end_time)) {
    return {
      success: false,
      error: "Debe especificar horarios de inicio y fin cuando está abierto",
    }
  }

  if (min_duration < 5) {
    return {
      success: false,
      error: "La duración mínima debe ser al menos 5 minutos",
    }
  }

  if (max_duration > 480) {
    return {
      success: false,
      error: "La duración máxima no puede superar 480 minutos (8 horas)",
    }
  }

  if (min_duration > max_duration) {
    return {
      success: false,
      error: "La duración mínima no puede ser mayor a la máxima",
    }
  }

  if (duration_interval < 1 || duration_interval > 60) {
    return {
      success: false,
      error: "El intervalo debe estar entre 1 y 60 minutos",
    }
  }

  const updateData = {
    is_open,
    start_time: is_open ? start_time : null,
    end_time: is_open ? end_time : null,
    min_duration,
    max_duration,
    duration_interval,
    updated_at: new Date().toISOString(),
  }

  const { error, data } = await supabase
    .from("appointment_settings")
    .update(updateData)
    .eq("id", id)
    .select()

  if (error) {
    console.error("[v0] ✗ Error updating appointment setting:", error)
    return {
      success: false,
      error: "Error al actualizar la configuración",
    }
  }

  revalidatePath("/settings/appointments")
  revalidatePath("/settings")
  revalidatePath("/citas")

  return {
    success: true,
  }
}
