"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { randomUUID } from "crypto"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission, type Permission } from "@/lib/permissions"
import { createAdminClient } from "@/lib/supabase/admin" // Import admin client for conflict checks to bypass RLS
import { serverLog } from "@/lib/server-log"

// Esquema de validación para citas
const appointmentSchema = z
  .object({
    propertyId: z.string().optional(),
    otherLocation: z.string().optional(),
    clientId: z.string().optional(),
    contactName: z.string().optional(),
    agentId: z.string().min(1, "El agente es requerido"),
    scheduledAt: z.string().datetime("Fecha y hora inválida"),
    duration: z
      .number()
      .min(5, "La duración mínima es 5 minutos")
      .max(480, "La duración máxima es 8 horas")
      .default(60),
    status: z.enum(["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA", "NO_ASISTIO"]).default("PENDIENTE"),
    notes: z.string().optional(),
  })
  .refine((data) => data.clientId || data.contactName, {
    message: "Debe proporcionar un cliente o nombre de contacto",
    path: ["clientId"],
  })
  .refine((data) => data.propertyId || data.otherLocation, {
    message: "Debe proporcionar una propiedad o un lugar alternativo",
    path: ["propertyId"],
  })

type AppointmentInput = z.infer<typeof appointmentSchema>
type AppointmentStatus = "PENDIENTE" | "CONFIRMADA" | "COMPLETADA" | "CANCELADA" | "NO_ASISTIO"
type AppointmentFormData = AppointmentInput
type AppointmentResult = {
  success: boolean
  data?: any
  error?: string
  conflictMessage?: string
}

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

async function isWithinWorkHours(date: Date): Promise<{ valid: boolean; message?: string }> {
  const { day, hours, minutes } = getArgentinaDateTime(date)

  // Domingo siempre cerrado
  if (day === 0) {
    return { valid: false, message: "No se pueden agendar citas los domingos" }
  }

  // Determinar el tipo de día
  let dayType: "WEEKDAY" | "SATURDAY" | "HOLIDAY" = "WEEKDAY"
  if (day === 6) {
    dayType = "SATURDAY"
  }
  // TODO: Implementar detección de feriados si se requiere
  
  // Obtener configuración desde la base de datos
  const supabase = await createServerClient()
  const { data: settings, error } = await supabase
    .from("appointment_settings")
    .select("*")
    .eq("day_type", dayType)
    .single()

  if (error || !settings) {
    serverLog.error("Error fetching appointment settings:", error)
    return { valid: false, message: "No se pudo verificar el horario de atención" }
  }

  // Si el día está cerrado
  if (!settings.is_open) {
    const dayName = dayType === "SATURDAY" ? "Sábados" : "ese día"
    return { valid: false, message: `${dayName} está cerrado para citas` }
  }

  // Verificar que tenga horarios configurados
  if (!settings.start_time || !settings.end_time) {
    return { valid: false, message: "Horarios no configurados correctamente" }
  }

  // Convertir hora actual a minutos desde medianoche
  const currentMinutes = hours * 60 + minutes

  // Parsear horarios de configuración (formato HH:MM)
  const [startHour, startMin] = settings.start_time.split(":").map(Number)
  const [endHour, endMin] = settings.end_time.split(":").map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return { valid: true }
  }

  const dayName = dayType === "SATURDAY" ? "Sábados" : "Lunes a Viernes"
  return {
    valid: false,
    message: `${dayName}: ${settings.start_time} a ${settings.end_time}`,
  }
}

// Verificar conflictos de horario para un agente
async function checkScheduleConflict(
  agentId: string,
  scheduledAt: Date,
  duration: number,
  excludeAppointmentId?: string,
): Promise<{ hasConflict: boolean; message?: string }> {
  const endTime = new Date(scheduledAt.getTime() + duration * 60000)

  const dayStart = new Date(scheduledAt)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(scheduledAt)
  dayEnd.setHours(23, 59, 59, 999)

  const supabase = createAdminClient()
  let query = supabase
    .from("appointments")
    .select(`
      *,
      property:properties(title),
      client:clients(name)
    `)
    .eq("agent_id", agentId)
    .in("status", ["PENDIENTE", "CONFIRMADA"])
    .gte("scheduled_date", dayStart.toISOString())
    .lte("scheduled_date", dayEnd.toISOString())

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId)
  }

  const { data: existingAppointments } = await query

  for (const existing of existingAppointments || []) {
    const existingStart = new Date(existing.scheduled_date)
    const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000)
    const hasOverlap = scheduledAt < existingEnd && endTime > existingStart

    if (hasOverlap) {
      const timeStr = existingStart.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })

      const clientName = existing.client?.name || existing.contact_name || "un cliente"
      const propertyTitle = existing.property?.title || existing.other_location || "una propiedad"

      return {
        hasConflict: true,
        message: `El agente ya tiene una cita con ${clientName} para ver "${propertyTitle}" a las ${timeStr}`,
      }
    }
  }

  return { hasConflict: false }
}

// Crear una nueva cita
export async function createAppointment(data: AppointmentFormData): Promise<AppointmentResult> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "Usuario no autenticado" }
    }

    const hasPermission = await checkPermission("appointments.create")
    if (!hasPermission) {
      return { success: false, error: "No tienes permisos para crear citas" }
    }

    const validatedData = appointmentSchema.parse(data)

    const scheduledDate = new Date(validatedData.scheduledAt)

    const now = new Date()
    if (scheduledDate < now) {
      return { success: false, error: "No se pueden agendar citas en el pasado" }
    }

    // Verificar que la duración esté dentro de los límites configurados
    const { day } = getArgentinaDateTime(scheduledDate)
    let dayType: "WEEKDAY" | "SATURDAY" | "HOLIDAY" = "WEEKDAY"
    if (day === 6) {
      dayType = "SATURDAY"
    }
    
    const supabase = await createServerClient()
    const { data: daySetting } = await supabase
      .from("appointment_settings")
      .select("*")
      .eq("day_type", dayType)
      .single()
    
    if (daySetting) {
      if (validatedData.duration < daySetting.min_duration) {
        return {
          success: false,
          error: `La duración mínima permitida es de ${daySetting.min_duration} minutos`,
        }
      }
      
      if (validatedData.duration > daySetting.max_duration) {
        return {
          success: false,
          error: `La duración máxima permitida es de ${daySetting.max_duration} minutos`,
        }
      }
    }
    
    const workHoursCheck = await isWithinWorkHours(scheduledDate)
    if (!workHoursCheck.valid) {
      return {
        success: false,
        error: workHoursCheck.message || "Horario no disponible",
      }
    }

    const endTime = new Date(scheduledDate.getTime() + validatedData.duration * 60000)
    const endTimeCheck = await isWithinWorkHours(endTime)
    if (!endTimeCheck.valid) {
      return {
        success: false,
        error: `La cita terminaría fuera del horario de atención (${endTimeCheck.message})`,
      }
    }

    const conflictCheck = await checkScheduleConflict(validatedData.agentId, scheduledDate, validatedData.duration)
    if (conflictCheck.hasConflict) {
      return {
        success: false,
        error: conflictCheck.message || "El agente ya tiene una cita en ese horario",
      }
    }

    const [propertyResult, clientResult, agentResult] = await Promise.all([
      validatedData.propertyId
        ? supabase.from("properties").select("*").eq("id", validatedData.propertyId).single()
        : { data: null },
      validatedData.clientId
        ? supabase.from("clients").select("*").eq("id", validatedData.clientId).single()
        : { data: null },
      supabase.from("users").select("*").eq("id", validatedData.agentId).single(),
    ])

    const property = propertyResult.data
    const client = clientResult.data
    const agent = agentResult.data

    if (validatedData.propertyId && !property) {
      return { success: false, error: "La propiedad no existe" }
    }

    if (!agent) {
      return { success: false, error: "El agente no existe" }
    }

    const appointmentId = randomUUID()

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        id: appointmentId,
        property_id: validatedData.propertyId || null,
        other_location: validatedData.otherLocation || null,
        client_id: validatedData.clientId || null,
        contact_name: validatedData.contactName || null,
        agent_id: validatedData.agentId,
        scheduled_date: scheduledDate.toISOString(),
        duration: validatedData.duration,
        status: validatedData.status,
        notes: validatedData.notes || null,
        created_by: currentUser.id, // Added created_by field
      })
      .select()
      .single()

    if (insertError) {
      serverLog.error("INSERT FAILED:", insertError.message, insertError.code ?? "")
      throw insertError
    }

    // TODO: Implementar sistema de notificaciones por email si se requiere

    revalidatePath("/appointments")
    return { success: true, data: appointment }
  } catch (error) {
    serverLog.error("Error creating appointment:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Datos inválidos",
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear la cita",
    }
  }
}

// Obtener todas las citas con filtros opcionales
export async function getAppointments(filters?: {
  agentId?: string
  clientId?: string
  contactName?: string
  propertyId?: string
  status?: AppointmentStatus
  startDate?: string
  endDate?: string
}) {
  try {
    const supabase = await createServerClient()

    let query = supabase
      .from("appointments")
      .select(`
        id,
        property_id,
        client_id,
        contact_name,
        other_location,
        agent_id,
        scheduled_date,
        duration,
        status,
        notes,
        created_at,
        property:properties(
          id,
          title,
          address,
          price,
          images,
          city:cities(id, name)
        ),
        client:clients(id, name, email, phone),
        agent:users!fk_appointments_agent(id, name, email)
      `)
      .order("scheduled_date", { ascending: true })

    if (filters?.agentId) query = query.eq("agent_id", filters.agentId)
    if (filters?.clientId) query = query.eq("client_id", filters.clientId)
    if (filters?.contactName) query = query.ilike("contact_name", `%${filters.contactName}%`)
    if (filters?.propertyId) query = query.eq("property_id", filters.propertyId)
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.startDate) query = query.gte("scheduled_date", filters.startDate)
    if (filters?.endDate) query = query.lte("scheduled_date", filters.endDate)

    const { data: appointments, error } = await query

    if (error) {
      serverLog.error("Error fetching appointments:", error)
      return { success: false, error: "Error al obtener las citas" }
    }

    const transformedAppointments =
      appointments?.map((apt) => {
        const property = Array.isArray(apt.property) ? apt.property[0] : apt.property
        const client = Array.isArray(apt.client) ? apt.client[0] : apt.client
        const agent = Array.isArray(apt.agent) ? apt.agent[0] : apt.agent

        return {
          id: apt.id,
          scheduledAt: apt.scheduled_date,
          duration: apt.duration,
          status: apt.status,
          notes: apt.notes,
          contactName: apt.contact_name,
          otherLocation: apt.other_location,
          property: property
            ? {
                id: property.id,
                title: property.title,
                address: property.address,
                price: property.price,
                city: (() => {
                  const cityData = property.city as any
                  if (!cityData) return "Sin ciudad"
                  if (Array.isArray(cityData)) return cityData[0]?.name || "Sin ciudad"
                  return cityData.name || "Sin ciudad"
                })(),
                images: property.images,
              }
            : null,
          client: client
            ? {
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
              }
            : null,
          agent: agent
            ? {
                id: agent.id,
                name: agent.name,
                email: agent.email,
              }
            : null,
        }
      }) || []

    return { success: true, data: transformedAppointments }
  } catch (error) {
    serverLog.error("Error fetching appointments:", error)
    return { success: false, error: "Error al obtener las citas" }
  }
}

// Obtener una cita por ID
export async function getAppointmentById(id: string) {
  try {
    const supabase = await createServerClient()
    const { data: appointment } = await supabase
      .from("appointments")
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users!fk_appointments_agent(id, name, email)
      `)
      .eq("id", id)
      .single()

    if (!appointment) {
      return { success: false, error: "Cita no encontrada" }
    }

    const transformedAppointment = {
      ...appointment,
      property: appointment.property
        ? {
            id: appointment.property.id,
            title: appointment.property.title,
            address: appointment.property.address,
          }
        : null,
      client: appointment.client
        ? {
            id: appointment.client.id,
            name: appointment.client.name,
            email: appointment.client.email,
            phone: appointment.client.phone,
          }
        : null,
      agent: appointment.agent
        ? {
            id: appointment.agent.id,
            name: appointment.agent.name,
            email: appointment.agent.email,
          }
        : null,
    }

    return { success: true, data: transformedAppointment }
  } catch (error) {
    serverLog.error("Error fetching appointment:", error)
    return { success: false, error: "Error al obtener la cita" }
  }
}

// Actualizar una cita
export async function updateAppointment(id: string, data: Partial<AppointmentInput>) {
  try {
    const supabase = await createServerClient()
    const { data: existing } = await supabase
      .from("appointments")
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users!fk_appointments_agent(id, name, email)
      `)
      .eq("id", id)
      .single()

    if (!existing) {
      return { success: false, error: "Cita no encontrada" }
    }

  if (data.scheduledAt || data.duration) {
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : existing.scheduled_date
    const duration = data.duration ?? existing.duration
    const agentId = data.agentId ?? existing.agent_id

    // Verificar que la duración esté dentro de los límites configurados
    const { day } = getArgentinaDateTime(scheduledAt)
    let dayType: "WEEKDAY" | "SATURDAY" | "HOLIDAY" = "WEEKDAY"
    if (day === 6) {
      dayType = "SATURDAY"
    }
    
    const { data: daySetting } = await supabase
      .from("appointment_settings")
      .select("*")
      .eq("day_type", dayType)
      .single()
    
    if (daySetting) {
      if (duration < daySetting.min_duration) {
        return {
          success: false,
          error: `La duración mínima permitida es de ${daySetting.min_duration} minutos`,
        }
      }
      
      if (duration > daySetting.max_duration) {
        return {
          success: false,
          error: `La duración máxima permitida es de ${daySetting.max_duration} minutos`,
        }
      }
    }

    const workHoursCheck = await isWithinWorkHours(scheduledAt)
    if (!workHoursCheck.valid) {
      return { success: false, error: workHoursCheck.message || "Horario no válido" }
    }

    const endTime = new Date(scheduledAt.getTime() + duration * 60000)
    const endTimeCheck = await isWithinWorkHours(endTime)
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
    if (data.propertyId !== undefined) updateData.property_id = data.propertyId || null
    if (data.otherLocation !== undefined) updateData.other_location = data.otherLocation || null
    if (data.clientId) updateData.client_id = data.clientId
    if (data.contactName) updateData.contact_name = data.contactName
    if (data.agentId) updateData.agent_id = data.agentId
    if (data.scheduledAt) updateData.scheduled_date = new Date(data.scheduledAt).toISOString()
    if (data.duration) updateData.duration = data.duration
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: updatedAppointment, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        property:properties(*),
        client:clients(*),
        agent:users!fk_appointments_agent(id, name, email)
      `)
      .single()

    if (error || !updatedAppointment) {
      serverLog.error("Error updating appointment:", error)
      return { success: false, error: "Error al actualizar la cita" }
    }

    revalidatePath("/appointments")
    return { success: true, data: updatedAppointment }
  } catch (error) {
    serverLog.error("Error updating appointment:", error)
    return { success: false, error: "Error al actualizar la cita" }
  }
}

// Eliminar una cita
export async function deleteAppointment(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    // Check if user has the delete permission (only ADMIN should have this)
    const hasDeletePermission = await checkPermission("appointments.delete" as Permission)
    if (!hasDeletePermission) {
      return { success: false, error: "Solo los administradores pueden eliminar citas" }
    }

    const supabase = await createServerClient()

    // Verify appointment exists
    const { data: appointment } = await supabase.from("appointments").select("id").eq("id", id).single()

    if (!appointment) {
      return { success: false, error: "Cita no encontrada" }
    }

    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) {
      serverLog.error("Error deleting appointment:", error)
      return { success: false, error: "Error al eliminar la cita" }
    }

    revalidatePath("/appointments")
    return { success: true }
  } catch (error) {
    serverLog.error("Error deleting appointment:", error)
    return { success: false, error: "Error al eliminar la cita" }
  }
}

// Cambiar el estado de una cita
export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  try {
    const supabase = await createServerClient()
    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select(`
        *,
        property:properties(id, title, address, city_id, images),
        client:clients(id, name, email, phone),
        agent:users!fk_appointments_agent(id, name, email)
      `)
      .single()

    if (error || !appointment) {
      serverLog.error("Error updating appointment status:", error)
      return { success: false, error: "Error al actualizar el estado de la cita" }
    }

    revalidatePath("/appointments")
    return { success: true, data: appointment }
  } catch (error) {
    serverLog.error("Error updating appointment status:", error)
    return { success: false, error: "Error al actualizar el estado de la cita" }
  }
}
