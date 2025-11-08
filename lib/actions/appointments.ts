"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { AppointmentStatus } from "@prisma/client"
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
  status: z.nativeEnum(AppointmentStatus).default("PENDIENTE"),
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

  const existingAppointments = await db.appointment.findMany({
    where: {
      agentId,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      status: { in: ["PENDIENTE", "CONFIRMADA"] },
      scheduledAt: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    include: {
      property: { select: { title: true } },
      client: { select: { name: true } },
    },
  })

  console.log("[v0] Found existing appointments:", existingAppointments.length)

  for (const existing of existingAppointments) {
    const existingEnd = new Date(existing.scheduledAt.getTime() + existing.duration * 60000)
    const hasOverlap = scheduledAt < existingEnd && endTime > existing.scheduledAt

    console.log("[v0] Checking overlap:", {
      existing: existing.scheduledAt.toISOString(),
      existingEnd: existingEnd.toISOString(),
      new: scheduledAt.toISOString(),
      newEnd: endTime.toISOString(),
      hasOverlap,
    })

    if (hasOverlap) {
      const timeStr = existing.scheduledAt.toLocaleTimeString("es-AR", {
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

    const [property, client, agent] = await Promise.all([
      db.property.findUnique({ where: { id: validated.propertyId } }),
      db.client.findUnique({ where: { id: validated.clientId } }),
      db.user.findUnique({ where: { id: validated.agentId } }),
    ])

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

    const appointment = await db.appointment.create({
      data: {
        propertyId: validated.propertyId,
        clientId: validated.clientId,
        agentId: validated.agentId,
        scheduledAt,
        duration: validated.duration,
        status: validated.status,
        notes: validated.notes,
      },
      include: {
        property: true,
        client: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    })

    console.log("[v0] ✓✓✓ APPOINTMENT CREATED SUCCESSFULLY ✓✓✓")
    console.log("[v0] Appointment ID:", appointment.id)

    if (client.email && agent.email) {
      console.log("[v0] Sending notifications...")
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
      console.error("[v0] Zod validation errors:", JSON.stringify(error.errors, null, 2))
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
  status?: AppointmentStatus
  startDate?: string
  endDate?: string
}) {
  try {
    const where: any = {}

    if (filters?.agentId) where.agentId = filters.agentId
    if (filters?.clientId) where.clientId = filters.clientId
    if (filters?.propertyId) where.propertyId = filters.propertyId
    if (filters?.status) where.status = filters.status

    if (filters?.startDate || filters?.endDate) {
      where.scheduledAt = {}
      if (filters.startDate) where.scheduledAt.gte = new Date(filters.startDate)
      if (filters.endDate) where.scheduledAt.lte = new Date(filters.endDate)
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            images: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    })

    return { success: true, data: appointments }
  } catch (error) {
    console.error("[v0] Error fetching appointments:", error)
    return { success: false, error: "Error al obtener las citas" }
  }
}

// Obtener una cita por ID
export async function getAppointmentById(id: string) {
  try {
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        property: true,
        client: true,
        agent: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

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

    const existing = await db.appointment.findUnique({
      where: { id },
      include: {
        property: true,
        client: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    })

    if (!existing) {
      return { success: false, error: "Cita no encontrada" }
    }

    if (data.scheduledAt || data.duration) {
      const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : existing.scheduledAt
      const duration = data.duration ?? existing.duration
      const agentId = data.agentId ?? existing.agentId

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
    if (data.propertyId) updateData.propertyId = data.propertyId
    if (data.clientId) updateData.clientId = data.clientId
    if (data.agentId) updateData.agentId = data.agentId
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt)
    if (data.duration) updateData.duration = data.duration
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    const appointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
        client: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    })

    console.log("[v0] Appointment updated successfully:", appointment.id)

    if (data.scheduledAt && appointment.client.email && appointment.agent.email) {
      await sendAppointmentNotifications({
        appointmentId: appointment.id,
        propertyTitle: appointment.property.title,
        propertyAddress: `${appointment.property.address}, ${appointment.property.city}`,
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        agentName: appointment.agent.name,
        agentEmail: appointment.agent.email,
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
        notes: appointment.notes || undefined,
      })
    }

    revalidatePath("/appointments")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("[v0] Error updating appointment:", error)
    return { success: false, error: "Error al actualizar la cita" }
  }
}

// Eliminar una cita
export async function deleteAppointment(id: string) {
  try {
    await db.appointment.delete({ where: { id } })
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
    const appointment = await db.appointment.update({
      where: { id },
      data: { status },
      include: {
        property: true,
        client: true,
        agent: { select: { id: true, name: true, email: true } },
      },
    })

    revalidatePath("/appointments")
    return { success: true, data: appointment }
  } catch (error) {
    console.error("[v0] Error updating appointment status:", error)
    return { success: false, error: "Error al actualizar el estado de la cita" }
  }
}
