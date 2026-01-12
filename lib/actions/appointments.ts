"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { sendAppointmentNotifications } from "@/lib/email-notifications"
import { randomUUID } from "crypto"
import { getCurrentUser } from "@/lib/auth"
import { checkPermission, type Permission } from "@/lib/permissions"

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
      .min(15, "La duración mínima es 15 minutos")
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

  console.log("[v0] Found existing appointments:", existingAppointments?.length || 0)

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
export async function createAppointment(data: AppointmentInput) {
  try {
    console.log("[v0] ========== CREATING APPOINTMENT ==========")
    console.log("[v0] Raw data received:", JSON.stringify(data, null, 2))

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log("[v0] ✗ User not authenticated")
      return { success: false, error: "Usuario no autenticado" }
    }
    console.log("[v0] ✓ Current user:", currentUser.id, currentUser.email)

    const validatedData = appointmentSchema.parse(data)
    console.log("[v0] ✓ Validation passed")

    const scheduledDate = new Date(validatedData.scheduledAt)
    console.log("[v0] Scheduled at (ISO):", scheduledDate.toISOString())
    console.log(
      "[v0] Scheduled at (Argentina):",
      scheduledDate.toLocaleString("es-AR", { timeZone: ARGENTINA_TIMEZONE }),
    )

    const now = new Date()
    if (scheduledDate < now) {
      console.log("[v0] ✗ Date is in the past")
      return { success: false, error: "No se pueden agendar citas en el pasado" }
    }
    console.log("[v0] ✓ Date is in the future")

    const workHoursCheck = isWithinWorkHours(scheduledDate)
    if (!workHoursCheck.valid) {
      console.log("[v0] ✗ Work hours check failed:", workHoursCheck.message)
      return { success: false, error: workHoursCheck.message || "Horario no válido" }
    }
    console.log("[v0] ✓ Work hours check passed")

    const endTime = new Date(scheduledDate.getTime() + validatedData.duration * 60000)
    const endTimeCheck = isWithinWorkHours(endTime)
    if (!endTimeCheck.valid) {
      console.log("[v0] ✗ End time check failed")
      return {
        success: false,
        error: "La cita se extiende fuera del horario de trabajo. Reduzca la duración o cambie la hora.",
      }
    }
    console.log("[v0] ✓ End time check passed")

    const conflictCheck = await checkScheduleConflict(validatedData.agentId, scheduledDate, validatedData.duration)
    if (conflictCheck.hasConflict) {
      console.log("[v0] ✗ Conflict found:", conflictCheck.message)
      return { success: false, error: conflictCheck.message || "Conflicto de horario" }
    }
    console.log("[v0] ✓ No conflicts found")

    const supabase = await createServerClient()

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
      console.log("[v0] ✗ Property not found")
      return { success: false, error: "La propiedad no existe" }
    }

    if (!agent) {
      console.log("[v0] ✗ Agent not found")
      return { success: false, error: "El agente no existe" }
    }
    console.log("[v0] ✓ All entities verified")

    const appointmentId = randomUUID()

    console.log("[v0] Attempting INSERT with data:", {
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

    console.log("[v0] INSERT result:", {
      success: !insertError,
      error: insertError,
      appointment,
    })

    if (insertError) {
      console.error("[v0] ✗ INSERT FAILED:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })
      throw insertError
    }

    console.log("[v0] ✓ INSERT successful")

    let clientName = validatedData.contactName || "Cliente no especificado"
    let clientEmail = ""
    if (validatedData.clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email")
        .eq("id", validatedData.clientId)
        .single()

      if (client) {
        clientName = client.name
        clientEmail = client.email || ""
      }
    }

    const { data: propertyData } = await supabase
      .from("properties")
      .select("title, address")
      .eq("id", validatedData.propertyId)
      .single()

    const { data: agentData } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", validatedData.agentId)
      .single()

    if (propertyData && agentData) {
      await sendAppointmentNotifications({
        appointmentId: appointment.id,
        propertyTitle: property?.title || "Otro lugar",
        propertyAddress: property?.address || validatedData.otherLocation || "Ubicación por confirmar",
        clientName: client?.name || validatedData.contactName || "Cliente",
        clientEmail: client?.email || null,
        agentName: agentData.name,
        agentEmail: agentData.email,
        scheduledAt: scheduledDate,
        duration: validatedData.duration,
        status: validatedData.status,
      })
    }

    revalidatePath("/appointments")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("[v0] Error creating appointment:", error)
    console.error("[v0] Full error details:", JSON.stringify(error, null, 2))
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
      console.error("[v0] Error fetching appointments:", error)
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
    console.error("[v0] Error fetching appointments:", error)
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
      console.error("[v0] Error updating appointment:", error)
      return { success: false, error: "Error al actualizar la cita" }
    }

    console.log("[v0] Appointment updated successfully:", updatedAppointment.id)

    if (updatedAppointment.client && updatedAppointment.agent) {
      await sendAppointmentNotifications({
        appointmentId: updatedAppointment.id,
        propertyTitle: updatedAppointment.property.title,
        propertyAddress: `${updatedAppointment.property.address}, ${updatedAppointment.property.city}`,
        clientName: updatedAppointment.client.name,
        clientEmail: updatedAppointment.client.email,
        agentName: updatedAppointment.agent.name,
        agentEmail: updatedAppointment.agent.email,
        scheduledAt: updatedAppointment.scheduled_date,
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
    // Check permissions
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    const supabase = await createServerClient()

    // Get the appointment to check ownership
    const { data: appointment } = await supabase
      .from("appointments")
      .select("agent_id, created_by")
      .eq("id", id)
      .single()

    if (!appointment) {
      return { success: false, error: "Cita no encontrada" }
    }

    // Check if user has permission to delete
    // Users can delete their own appointments, or if they have appointments.manage permission
    const hasPermission = await checkPermission("appointments.manage" as Permission)
    const isOwner = appointment.agent_id === user.id || appointment.created_by === user.id

    if (!hasPermission && !isOwner && user.role !== "ADMIN") {
      return { success: false, error: "No tienes permisos para eliminar esta cita" }
    }

    const { error } = await supabase.from("appointments").delete().eq("id", id)

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
