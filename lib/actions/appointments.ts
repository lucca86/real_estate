"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { sendAppointmentNotifications } from "@/lib/email-notifications"

// Esquema de validación para citas
const appointmentSchema = z.object({
  propertyId: z.string().min(1, "La propiedad es requerida"),
  clientId: z.string().min(1, "El cliente es requerido"),
  agentId: z.string().min(1, "El agente es requerido"),
  scheduledAt: z.string().datetime("Fecha y hora inválida"),
  duration: z
    .number()
    .min(15, "La duración mínima es 15 minutos")
    .max(480, "La duración máxima es 8 horas")
    .default(60),
  status: z.enum(["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA", "NO_ASISTIO"]).default("PENDIENTE"),
  notes: z.string().optional(),
})

type AppointmentInput = z.infer<typeof appointmentSchema>

// Horarios de trabajo
const WORK_HOURS = {
  weekday: {
    morning: { start: 7.5, end: 12.5 }, // 7:30 - 12:30
    afternoon: { start: 16.5, end: 20.5 }, // 16:30 - 20:30
  },
  saturday: {
    morning: { start: 9, end: 12 }, // 9:00 - 12:00
  },
}

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires"

function getArgentinaDateTime(date: Date): { day: number; hours: number; minutes: number } {
  // Use Intl.DateTimeFormat to get the date/time in Argentina timezone
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: ARGENTINA_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const weekday = parts.find((p) => p.type === "weekday")?.value
  const hour = Number.parseInt(parts.find((p) => p.type === "hour")?.value || "0")
  const minute = Number.parseInt(parts.find((p) => p.type === "minute")?.value || "0")

  // Convert weekday to number (0 = Sunday, 6 = Saturday)
  const dayMap: Record<string, number> = {
    dom: 0,
    lun: 1,
    mar: 2,
    mié: 3,
    jue: 4,
    vie: 5,
    sáb: 6,
  }

  const day = dayMap[weekday || ""] ?? 0

  return { day, hours: hour + minute / 60, minutes: minute }
}

function isWithinWorkHours(date: Date): { valid: boolean; message?: string } {
  const { day, hours } = getArgentinaDateTime(date)

  console.log("[v0] Validating work hours (Argentina time):", {
    day,
    hours: hours.toFixed(2),
    date: date.toISOString(),
  })

  if (day === 0) {
    return { valid: false, message: "No se pueden agendar citas los domingos" }
  }

  if (day === 6) {
    if (hours >= WORK_HOURS.saturday.morning.start && hours < WORK_HOURS.saturday.morning.end) {
      return { valid: true }
    }
    return { valid: false, message: "Los sábados solo se atiende de 9:00 a 12:00" }
  }

  const inMorning = hours >= WORK_HOURS.weekday.morning.start && hours < WORK_HOURS.weekday.morning.end
  const inAfternoon = hours >= WORK_HOURS.weekday.afternoon.start && hours < WORK_HOURS.weekday.afternoon.end

  if (inMorning || inAfternoon) {
    return { valid: true }
  }

  return {
    valid: false,
    message: "Horario de atención: Lunes a Viernes 7:30-12:30 y 16:30-20:30",
  }
}

// Verificar conflictos de horario para un agente
async function checkScheduleConflict(
  agentId: string,
  scheduledAt: Date,
  duration: number,
  excludeAppointmentId?: string,
): Promise<{ hasConflict: boolean; message?: string }> {
  console.log("[v0] Checking conflicts for:", {
    agentId,
    scheduledAt: scheduledAt.toISOString(),
    duration,
    excludeAppointmentId,
  })

  const endTime = new Date(scheduledAt.getTime() + duration * 60000)

  const dayStart = new Date(scheduledAt)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(scheduledAt)
  dayEnd.setHours(23, 59, 59, 999)

  const supabase = await createServerClient()
  let query = supabase
    .from('appointments')
    .select(`
      *,
      property:properties(title),
      client:clients(name)
    `)
    .eq('agent_id', agentId)
    .in('status', ['PENDIENTE', 'CONFIRMADA'])
    .gte('scheduled_at', dayStart.toISOString())
    .lte('scheduled_at', dayEnd.toISOString())

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId)
  }

  const { data: existingAppointments } = await query

  console.log("[v0] Found existing appointments:", existingAppointments?.length || 0)

  for (const existing of existingAppointments || []) {
    const existingStart = new Date(existing.scheduled_at)
    const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000)
    const hasOverlap = scheduledAt < existingEnd && endTime > existingStart

    if (hasOverlap) {
      const timeStr = existingStart.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
      return {
        hasConflict: true,
        message: `El agente ya tiene una cita con ${existing.client.name} para ver "${existing.property.title}" a las ${timeStr}`,
      }
    }
  }

  return { hasConflict: false }
}

// Crear una nueva cita
export async function createAppointment(data: AppointmentInput) {
  try {
    console.log("[v0] ========== CREATING APPOINTMENT ==========")
    console.log("[v0] Raw data received:", JSON.stringify(data, null, 2))

    const validated = appointmentSchema.parse(data)
    console.log("[v0] ✓ Validation passed")

    const scheduledAt = new Date(validated.scheduledAt)
    console.log("[v0] Scheduled at (ISO):", scheduledAt.toISOString())
    console.log("[v0] Scheduled at (Argentina):", scheduledAt.toLocaleString("es-AR", { timeZone: ARGENTINA_TIMEZONE }))

    const now = new Date()
    if (scheduledAt < now) {
      console.log("[v0] ✗ Date is in the past")
      return { success: false, error: "No se pueden agendar citas en el pasado" }
    }
    console.log("[v0] ✓ Date is in the future")

    const workHoursCheck = isWithinWorkHours(scheduledAt)
    if (!workHoursCheck.valid) {
      console.log("[v0] ✗ Work hours check failed:", workHoursCheck.message)
      return { success: false, error: workHoursCheck.message || "Horario no válido" }
    }
    console.log("[v0] ✓ Work hours check passed")

    const endTime = new Date(scheduledAt.getTime() + validated.duration * 60000)
    const endTimeCheck = isWithinWorkHours(endTime)
    if (!endTimeCheck.valid) {
      console.log("[v0] ✗ End time check failed")
      return {
        success: false,
        error: "La cita se extiende fuera del horario de trabajo. Reduzca la duración o cambie la hora.",
      }
    }
    console.log("[v0] ✓ End time check passed")

    const conflictCheck = await checkScheduleConflict(validated.agentId, scheduledAt, validated.duration)
    if (conflictCheck.hasConflict) {
      console.log("[v0] ✗ Conflict found:", conflictCheck.message)
      return { success: false, error: conflictCheck.message || "Conflicto de horario" }
    }
    console.log("[v0] ✓ No conflicts found")

    const supabase = await createServerClient()
    
    const [propertyResult, clientResult, agentResult] = await Promise.all([
      supabase.from('properties').select('*').eq('id', validated.propertyId).single(),
      supabase.from('clients').select('*').eq('id', validated.clientId).single(),
      supabase.from('users').select('*').eq('id', validated.agentId).single(),
    ])

    const property = propertyResult.data
    const client = clientResult.data
    const agent = agentResult.data

    if (!property) {
      console.log("[v0] ✗ Property not found")
      return { success: false, error: "La propiedad no existe" }
    }
    if (!client) {
      console.log("[v0] ✗ Client not found")
      return { success: false, error: "El cliente no existe" }
    }
    if (!agent) {
      console.log("[v0] ✗ Agent not found")
      return { success: false, error: "El agente no existe" }
    }
    console.log("[v0] ✓ All entities exist")

    console.log("[v0] Creating appointment in database...")

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        property_id: validated.propertyId,
        client_id: validated.clientId,
        agent_id: validated.agentId,
        scheduled_at: scheduledAt.toISOString(),
        duration: validated.duration,
        status: validated.status,
        notes: validated.notes,
      })
      .select(`
        *,
        property:properties(*),
        client:clients(*),
        agent:users(id, name, email)
      `)
      .single()

    if (error || !appointment) {
      console.error('[v0] Error creating appointment:', error)
      return { success: false, error: "Error al crear la cita" }
    }

    console.log("[v0] ✓✓✓ APPOINTMENT CREATED SUCCESSFULLY ✓✓✓")

    if (client.email && agent.email) {
      await sendAppointmentNotifications({
        appointmentId: appointment.id,
        propertyTitle: property.title,
        propertyAddress: `${property.address}, ${property.city}`,
        clientName: client.name,
        clientEmail: client.email,
        agentName: agent.name,
        agentEmail: agent.email,
        scheduledAt,
        duration: validated.duration,
        notes: validated.notes,
      })
    }

    revalidatePath("/appointments")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("[v0] ✗✗✗ ERROR CREATING APPOINTMENT ✗✗✗")
    console.error("[v0] Error details:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Error al crear la cita" }
  }
}

// Obtener todas las citas con filtros opcionales
export async function getAppointments(filters?: {
  agentId?: string
  clientId?: string
  propertyId?: string
  status?: "PENDIENTE" | "CONFIRMADA" | "COMPLETADA" | "CANCELADA" | "NO_ASISTIO"
  startDate?: string
  endDate?: string
}) {
  try {
    const supabase = await createServerClient()
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users(id, name, email, phone)
      `)
      .order('scheduled_at', { ascending: true })

    if (filters?.agentId) query = query.eq('agent_id', filters.agentId)
    if (filters?.clientId) query = query.eq('client_id', filters.clientId)
    if (filters?.propertyId) query = query.eq('property_id', filters.propertyId)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.startDate) query = query.gte('scheduled_at', filters.startDate)
    if (filters?.endDate) query = query.lte('scheduled_at', filters.endDate)

    const { data: appointments } = await query

    return { success: true, data: appointments }
  } catch (error) {
    console.error("[v0] Error fetching appointments:", error)
    return { success: false, error: "Error al obtener las citas" }
  }
}

// Obtener una cita por ID
export async function getAppointmentById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (!appointment) {
      return { success: false, error: "Cita no encontrada" }
    }

    return { success: true, data: appointment }
  } catch (error) {
    console.error("[v0] Error fetching appointment:", error)
    return { success: false, error: "Error al obtener la cita" }
  }
}

// Actualizar una cita
export async function updateAppointment(id: string, data: Partial<AppointmentInput>) {
  try {
    console.log("[v0] Updating appointment:", id, data)

    const supabase = await createServerClient()
    const { data: existing } = await supabase
      .from('appointments')
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (!existing) {
      return { success: false, error: "Cita no encontrada" }
    }

    if (data.scheduledAt || data.duration) {
      const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : existing.scheduled_at
      const duration = data.duration ?? existing.duration
      const agentId = data.agentId ?? existing.agent_id

      const workHoursCheck = isWithinWorkHours(scheduledAt)
      if (!workHoursCheck.valid) {
        return { success: false, error: workHoursCheck.message || "Horario no válido" }
      }

      const endTime = new Date(scheduledAt.getTime() + duration * 60000)
      const endTimeCheck = isWithinWorkHours(endTime)
      if (!endTimeCheck.valid) {
        return {
          success: false,
          error: "La cita se extiende fuera del horario de trabajo",
        }
      }

      const conflictCheck = await checkScheduleConflict(agentId, scheduledAt, duration, id)
      if (conflictCheck.hasConflict) {
        return { success: false, error: conflictCheck.message || "Conflicto de horario" }
      }
    }

    const updateData: any = {}
    if (data.propertyId) updateData.property_id = data.propertyId
    if (data.clientId) updateData.client_id = data.clientId
    if (data.agentId) updateData.agent_id = data.agentId
    if (data.scheduledAt) updateData.scheduled_at = new Date(data.scheduledAt).toISOString()
    if (data.duration) updateData.duration = data.duration
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: updatedAppointment, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users(id, name, email)
      `)
      .single()

    if (error || !updatedAppointment) {
      console.error("[v0] Error updating appointment:", error)
      return { success: false, error: "Error al actualizar la cita" }
    }

    console.log("[v0] Appointment updated successfully:", updatedAppointment.id)

    if (data.scheduledAt && updatedAppointment.client.email && updatedAppointment.agent.email) {
      await sendAppointmentNotifications({
        appointmentId: updatedAppointment.id,
        propertyTitle: updatedAppointment.property.title,
        propertyAddress: `${updatedAppointment.property.address}, ${updatedAppointment.property.city}`,
        clientName: updatedAppointment.client.name,
        clientEmail: updatedAppointment.client.email,
        agentName: updatedAppointment.agent.name,
        agentEmail: updatedAppointment.agent.email,
        scheduledAt: updatedAppointment.scheduled_at,
        duration: updatedAppointment.duration,
        notes: updatedAppointment.notes || undefined,
      })
    }

    revalidatePath("/appointments")
    return { success: true, data: updatedAppointment }
  } catch (error) {
    console.error("[v0] Error updating appointment:", error)
    return { success: false, error: "Error al actualizar la cita" }
  }
}

// Eliminar una cita
export async function deleteAppointment(id: string) {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from('appointments').delete().eq('id', id)

    if (error) {
      console.error("[v0] Error deleting appointment:", error)
      return { success: false, error: "Error al eliminar la cita" }
    }

    revalidatePath("/appointments")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting appointment:", error)
    return { success: false, error: "Error al eliminar la cita" }
  }
}

// Cambiar el estado de una cita
export async function updateAppointmentStatus(id: string, status: "PENDIENTE" | "CONFIRMADA" | "COMPLETADA" | "CANCELADA" | "NO_ASISTIO") {
  try {
    const supabase = await createServerClient()
    const { data: appointment, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users(id, name, email)
      `)
      .single()

    if (error || !appointment) {
      console.error("[v0] Error updating appointment status:", error)
      return { success: false, error: "Error al actualizar el estado de la cita" }
    }

    revalidatePath("/appointments")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("[v0] Error updating appointment status:", error)
    return { success: false, error: "Error al actualizar el estado de la cita" }
  }
}
