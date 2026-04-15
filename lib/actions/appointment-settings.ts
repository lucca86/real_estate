"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types/action-result"

export interface AppointmentSetting {
  id: string
  dayType: "WEEKDAY" | "SATURDAY" | "HOLIDAY"
  isOpen: boolean
  startTime: string | null
  endTime: string | null
  minDuration: number
  maxDuration: number
  durationInterval: number
}

export async function getAppointmentSettings(): Promise<AppointmentSetting[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("AppointmentSetting")
    .select("*")
    .order("dayType")

  if (error) return []

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

  const isOpen = formData.get("is_open") === "true"
  const startTime = formData.get("start_time") as string | null
  const endTime = formData.get("end_time") as string | null
  const minDuration = Number.parseInt(formData.get("min_duration") as string)
  const maxDuration = Number.parseInt(formData.get("max_duration") as string)
  const durationInterval = Number.parseInt(formData.get("duration_interval") as string)

  // Validaciones
  if (isOpen && (!startTime || !endTime)) {
    return {
      success: false,
      error: "Debe especificar horarios de inicio y fin cuando está abierto",
    }
  }

  if (minDuration < 5) {
    return {
      success: false,
      error: "La duración mínima debe ser al menos 5 minutos",
    }
  }

  if (maxDuration > 480) {
    return {
      success: false,
      error: "La duración máxima no puede superar 480 minutos (8 horas)",
    }
  }

  if (minDuration > maxDuration) {
    return {
      success: false,
      error: "La duración mínima no puede ser mayor a la máxima",
    }
  }

  if (durationInterval < 1 || durationInterval > 60) {
    return {
      success: false,
      error: "El intervalo debe estar entre 1 y 60 minutos",
    }
  }

  const updateData = {
    isOpen,
    startTime: isOpen ? startTime : null,
    endTime: isOpen ? endTime : null,
    minDuration,
    maxDuration,
    durationInterval,
  }

  const { error, data } = await supabase
    .from("AppointmentSetting")
    .update(updateData)
    .eq("id", id)
    .select()

  if (error) {
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
