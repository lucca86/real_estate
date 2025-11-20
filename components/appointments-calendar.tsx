"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react"
import Link from "next/link"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import { getArgentinaTime, formatArgentinaDate } from "@/lib/timezone-utils"

interface Appointment {
  id: string
  scheduledAt: string // Changed from Date to string since data comes as ISO string
  duration: number
  status: string
  property: {
    title: string
    address: string
    city: string
  }
  client: {
    name: string
  }
  agent: {
    name: string
  }
}

interface AppointmentsCalendarProps {
  appointments: Appointment[]
}

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: es })
  const calendarEnd = endOfWeek(monthEnd, { locale: es })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const appointmentDate = new Date(apt.scheduledAt)
      return isSameDay(appointmentDate, day)
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "CONFIRMADA":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "COMPLETADA":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "CANCELADA":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendario mensual */}
          <div className="grid grid-cols-7 gap-2">
            {/* Días de la semana */}
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}

            {/* Días del mes */}
            {calendarDays.map((day) => {
              const dayAppointments = getAppointmentsForDay(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-2 border rounded-lg ${
                    isCurrentMonth ? "bg-card" : "bg-muted/50"
                  } ${isToday ? "border-primary" : "border-border"}`}
                >
                  <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <Link key={apt.id} href={`/appointments/${apt.id}/edit`}>
                        <div className={`text-xs p-1 rounded truncate ${getStatusColor(apt.status)}`}>
                          {getArgentinaTime(apt.scheduledAt)} - {apt.client.name}
                        </div>
                      </Link>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{dayAppointments.length - 2} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de próximas citas */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Citas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments
              .filter((apt) => {
                const appointmentDate = new Date(apt.scheduledAt)
                return appointmentDate >= new Date() && apt.status !== "CANCELADA"
              })
              .slice(0, 5)
              .map((apt) => (
                <Link key={apt.id} href={`/appointments/${apt.id}/edit`}>
                  <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                        <span className="font-medium">{apt.property.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatArgentinaDate(apt.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {apt.client.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {apt.property.city}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">Agente: {apt.agent.name}</div>
                    </div>
                  </div>
                </Link>
              ))}
            {appointments.filter((apt) => new Date(apt.scheduledAt) >= new Date()).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No hay citas próximas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
