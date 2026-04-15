"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

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
  const supabase = await createAdminClient()
  const { data: settings, error } = await supabase
    .from("AppointmentSetting")
    .select("*")
    .eq("dayType", dayType)
    .single()

  if (error || !settings) {
    serverLog.error("Error fetching appointment settings:", error)
    return { valid: false, message: "No se pudo verificar el horario de atención" }
  }

  const s = settings as any

  // Si el día está cerrado
  if (!s.isOpen) {
    const dayName = dayType === "SATURDAY" ? "Sábados" : "ese día"
    return { valid: false, message: `${dayName} está cerrado para citas` }
  }

  // Verificar que tenga horarios configurados
  if (!s.startTime || !s.endTime) {
    return { valid: false, message: "Horarios no configurados correctamente" }
  }

  // Convertir hora actual a minutos desde medianoche
  const currentMinutes = hours * 60 + minutes

  // Parsear horarios de configuración (formato HH:MM)
  const [startHour, startMin] = s.startTime.split(":").map(Number)
  const [endHour, endMin] = s.endTime.split(":").map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return { valid: true }
  }

  const dayName = dayType === "SATURDAY" ? "Sábados" : "Lunes a Viernes"
  return {
    valid: false,
    message: `${dayName}: ${s.startTime} a ${s.endTime}`,
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
    .from("Appointment")
    .select(`
      *,
      property:Property(title),
      client:Client(name)
    `)
    .eq("agentId", agentId)
    .in("status", ["PENDIENTE", "CONFIRMADA"])
    .gte("scheduledDate", dayStart.toISOString())
    .lte("scheduledDate", dayEnd.toISOString())

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
    
    const supabase = await createAdminClient()
    const { data: daySetting } = await supabase
      .from("AppointmentSetting")
      .select("*")
      .eq("dayType", dayType)
      .single()
    
    if (daySetting) {
      const ds = daySetting as any
      if (validatedData.duration < ds.minDuration) {
        return {
          success: false,
          error: `La duración mínima permitida es de ${ds.minDuration} minutos`,
        }
      }
      
      if (validatedData.duration > ds.maxDuration) {
        return {
          success: false,
          error: `La duración máxima permitida es de ${ds.maxDuration} minutos`,
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
        ? supabase.from("Property").select("*").eq("id", validatedData.propertyId).single()
        : { data: null },
      validatedData.clientId
        ? supabase.from("Client").select("*").eq("id", validatedData.clientId).single()
        : { data: null },
      supabase.from("User").select("*").eq("id", validatedData.agentId).single(),
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
      .from("Appointment")
      .insert({
        id: appointmentId,
        propertyId: validatedData.propertyId || null,
        otherLocation: validatedData.otherLocation || null,
        clientId: validatedData.clientId || null,
        contactName: validatedData.contactName || null,
        agentId: validatedData.agentId,
        scheduledDate: scheduledDate.toISOString(),
        duration: validatedData.duration,
        status: validatedData.status,
        notes: validatedData.notes || null,
        createdBy: currentUser.id,
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
    const supabase = await createAdminClient()

    let query = supabase
      .from("Appointment")
      .select(`
        id, propertyId, clientId, contactName, otherLocation,
        agentId, scheduledDate, duration, status, notes, createdAt,
        property:Property(id, title, address, price, images, city:City(id, name)),
        client:Client(id, name, email, phone),
        agent:User!Appointment_agentId_fkey(id, name, email)
      `)
      .order("scheduledDate", { ascending: true })

    if (filters?.agentId) query = query.eq("agentId", filters.agentId)
    if (filters?.clientId) query = query.eq("clientId", filters.clientId)
    if (filters?.contactName) query = query.ilike("contactName", `%${filters.contactName}%`)
    if (filters?.propertyId) query = query.eq("propertyId", filters.propertyId)
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.startDate) query = query.gte("scheduledDate", filters.startDate)
    if (filters?.endDate) query = query.lte("scheduledDate", filters.endDate)

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
          scheduledAt: (apt as any).scheduledDate,
          duration: apt.duration,
          status: apt.status,
          notes: apt.notes,
          contactName: (apt as any).contactName,
          otherLocation: (apt as any).otherLocation,
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
    const supabase = await createAdminClient()
    const { data: appointment } = await supabase
      .from("Appointment")
      .select(`
        *,
        property:Property(id, title, address, cityId, images),
        client:Client(id, name, email, phone),
        agent:User!Appointment_agentId_fkey(id, name, email)
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
    const supabase = await createAdminClient()
    const { data: existing } = await supabase
      .from("Appointment")
      .select(`
        *,
        property:Property(id, title, address, cityId, images),
        client:Client(id, name, email, phone),
        agent:User!Appointment_agentId_fkey(id, name, email)
      `)
      .eq("id", id)
      .single()

    if (!existing) {
      return { success: false, error: "Cita no encontrada" }
    }

  if (data.scheduledAt || data.duration) {
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : (existing as any).scheduledDate
    const duration = data.duration ?? existing.duration
    const agentId = data.agentId ?? (existing as any).agentId

    // Verificar que la duración esté dentro de los límites configurados
    const { day } = getArgentinaDateTime(scheduledAt)
    let dayType: "WEEKDAY" | "SATURDAY" | "HOLIDAY" = "WEEKDAY"
    if (day === 6) {
      dayType = "SATURDAY"
    }
    
    const { data: daySetting } = await supabase
      .from("AppointmentSetting")
      .select("*")
      .eq("dayType", dayType)
      .single()
    
    if (daySetting) {
      if (duration < (daySetting as any).minDuration) {
        return {
          success: false,
          error: `La duración mínima permitida es de ${(daySetting as any).minDuration} minutos`,
        }
      }
      
      if (duration > (daySetting as any).maxDuration) {
        return {
          success: false,
          error: `La duración máxima permitida es de ${(daySetting as any).maxDuration} minutos`,
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
    if (data.propertyId !== undefined) updateData.propertyId = data.propertyId || null
    if (data.otherLocation !== undefined) updateData.otherLocation = data.otherLocation || null
    if (data.clientId) updateData.clientId = data.clientId
    if (data.contactName) updateData.contactName = data.contactName
    if (data.agentId) updateData.agentId = data.agentId
    if (data.scheduledAt) updateData.scheduledDate = new Date(data.scheduledAt).toISOString()
    if (data.duration) updateData.duration = data.duration
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const { data: updatedAppointment, error } = await supabase
      .from("Appointment")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        property:Property(*),
        client:Client(*),
        agent:User!Appointment_agentId_fkey(id, name, email)
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

    const supabase = await createAdminClient()

    // Verify appointment exists
    const { data: appointment } = await supabase.from("Appointment").select("id").eq("id", id).single()

    if (!appointment) {
      return { success: false, error: "Cita no encontrada" }
    }

    const { error } = await supabase.from("Appointment").delete().eq("id", id)

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
    const supabase = await createAdminClient()
    const { data: appointment, error } = await supabase
      .from("Appointment")
      .update({ status })
      .eq("id", id)
      .select(`
        *,
        property:Property(id, title, address, cityId, images),
        client:Client(id, name, email, phone),
        agent:User!Appointment_agentId_fkey(id, name, email)
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
