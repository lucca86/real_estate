"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  scheduledAt: string
  duration: number
  status: string
  property?:
    | {
        id: string
        title: string
        address: string
        price: number
        city: string
        images: string[]
      }
    | null
    | undefined
  otherLocation?: string
  client:
    | {
        name: string
      }
    | null
    | undefined
  agent:
    | {
        name: string
      }
    | null
    | undefined
  contactName?: string
}

interface AppointmentsCalendarProps {
  appointments: Appointment[]
}

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
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
          <TooltipProvider>
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
                  <Tooltip key={day.toISOString()}>
                    <TooltipTrigger asChild>
                      <div
                        className={`min-h-24 p-2 border rounded-lg cursor-pointer ${
                          isCurrentMonth ? "bg-card" : "bg-muted/50"
                        } ${isToday ? "border-primary" : "border-border"} ${
                          dayAppointments.length > 0 ? "hover:bg-accent/50 transition-colors" : ""
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt) => (
                            <Link key={apt.id} href={`/appointments/${apt.id}/edit`}>
                              <div className={`text-xs p-1 rounded truncate ${getStatusColor(apt.status)}`}>
                                {getArgentinaTime(apt.scheduledAt)} -{" "}
                                {apt.contactName || apt.client?.name || "Sin nombre"}
                              </div>
                            </Link>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{dayAppointments.length - 2} más</div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    {dayAppointments.length > 0 && (
                      <TooltipContent
                        side="right"
                        className="max-w-sm p-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-xl"
                      >
                        <div className="space-y-3">
                          <p className="font-semibold text-sm mb-3 border-b border-gray-300 dark:border-gray-700 pb-2">
                            {format(day, "d 'de' MMMM", { locale: es })} - {dayAppointments.length}{" "}
                            {dayAppointments.length === 1 ? "cita" : "citas"}
                          </p>
                          {dayAppointments.map((apt) => (
                            <Link key={apt.id} href={`/appointments/${apt.id}/edit`} className="block">
                              <div className="text-xs space-y-1.5 pb-3 border-b border-gray-300 dark:border-gray-700 last:border-0 last:pb-0 hover:bg-gray-100 dark:hover:bg-gray-800 -mx-2 px-2 py-2 rounded transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {getArgentinaTime(apt.scheduledAt)}
                                  </span>
                                  <Badge className={getStatusColor(apt.status)} variant="outline">
                                    {apt.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <User className="h-3 w-3" />
                                  <span>{apt.contactName || apt.client?.name || "Sin nombre"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">
                                    {apt.property?.title || apt.otherLocation || "Ubicación no especificada"}
                                  </span>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300">
                                  Agente: {apt.agent?.name || "Sin asignar"}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>
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
                        <span className="font-medium">
                          {apt.property?.title || apt.otherLocation || "Ubicación no especificada"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatArgentinaDate(apt.scheduledAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {apt.contactName || apt.client?.name || "Sin nombre"}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {apt.property?.city || "Ciudad no especificada"}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">Agente: {apt.agent?.name || "Sin asignar"}</div>
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
