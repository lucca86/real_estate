"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, MapPin, User, Calendar, Edit, Building2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getArgentinaTime } from "@/lib/timezone-utils"
import { DeleteAppointmentButton } from "@/components/delete-appointment-button"

interface Appointment {
  id: string
  scheduledAt: string
  duration: number
  status: string
  notes?: string
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

interface PositionedAppointment {
  id: string
  scheduledAt: string
  duration: number
  status: string
  notes?: string
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
  top: number
  height: number
  column: number
  totalColumns: number
  startTime: number
  endTime: number
}

interface AppointmentsDayViewProps {
  appointments: Appointment[]
  selectedDate: Date
  canDelete?: boolean // Added canDelete prop
}

export default function AppointmentsDayView({
  appointments,
  selectedDate,
  canDelete = false,
}: AppointmentsDayViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Filtrar citas del día seleccionado
  const dayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduledAt)
    return (
      aptDate.getDate() === selectedDate.getDate() &&
      aptDate.getMonth() === selectedDate.getMonth() &&
      aptDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  // Horas del día (7:00 AM - 9:00 PM)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7)

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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-yellow-500/20 border-l-yellow-500"
      case "CONFIRMADA":
        return "bg-blue-500/20 border-l-blue-500"
      case "COMPLETADA":
        return "bg-green-500/20 border-l-green-500"
      case "CANCELADA":
        return "bg-red-500/20 border-l-red-500"
      default:
        return "bg-gray-500/20 border-l-gray-500"
    }
  }

  const getAppointmentPosition = (appointment: Appointment) => {
    const aptDate = new Date(appointment.scheduledAt)
    const hour = aptDate.getHours()
    const minutes = aptDate.getMinutes()

    // Calcular posición desde las 7:00 AM
    const hoursSince7AM = hour - 7
    const top = hoursSince7AM * 120 + (minutes / 60) * 120 // 120px por hora

    const height = (appointment.duration / 60) * 120 // 120px por hora

    return { top, height }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const doAppointmentsOverlap = (apt1: Appointment, apt2: Appointment) => {
    const start1 = new Date(apt1.scheduledAt).getTime()
    const end1 = start1 + apt1.duration * 60000
    const start2 = new Date(apt2.scheduledAt).getTime()
    const end2 = start2 + apt2.duration * 60000

    return start1 < end2 && start2 <= end1
  }

  const calculateAppointmentColumns = (appointments: Appointment[]): PositionedAppointment[] => {
    if (appointments.length === 0) return []

    // Ordenar por hora de inicio, luego por duración (más largas primero)
    const sorted = [...appointments].sort((a, b) => {
      const timeA = new Date(a.scheduledAt).getTime()
      const timeB = new Date(b.scheduledAt).getTime()
      if (timeA !== timeB) return timeA - timeB
      return b.duration - a.duration // Más largas primero
    })

    console.log("[v0] Calculating columns for", sorted.length, "appointments")

    // Calcular posiciones y tiempos
    const positioned: PositionedAppointment[] = sorted.map((apt) => ({
      ...apt,
      ...getAppointmentPosition(apt),
      startTime: new Date(apt.scheduledAt).getTime(),
      endTime: new Date(apt.scheduledAt).getTime() + apt.duration * 60000,
      column: 0,
      totalColumns: 1,
    }))

    // Asignar columnas
    for (let i = 0; i < positioned.length; i++) {
      const current = positioned[i]
      const currentTime = format(new Date(current.scheduledAt), "HH:mm")

      console.log(`[v0] Processing appointment ${i} at ${currentTime}`)

      // Encontrar todas las citas previas que se solapan o son adyacentes
      const overlappingColumns: number[] = []
      for (let j = 0; j < i; j++) {
        const other = positioned[j]
        const otherTime = format(new Date(other.scheduledAt), "HH:mm")

        const overlaps = current.startTime <= other.endTime && other.startTime <= current.endTime

        console.log(`  Checking against ${j} at ${otherTime}:`, {
          currentStart: format(new Date(current.startTime), "HH:mm:ss"),
          currentEnd: format(new Date(current.endTime), "HH:mm:ss"),
          otherStart: format(new Date(other.startTime), "HH:mm:ss"),
          otherEnd: format(new Date(other.endTime), "HH:mm:ss"),
          "current.startTime <= other.endTime": current.startTime <= other.endTime,
          "other.startTime <= current.endTime": other.startTime <= current.endTime,
          overlaps,
        })

        if (overlaps) {
          overlappingColumns.push(other.column)
          console.log(`    → OVERLAP DETECTED! Other is in column ${other.column}`)
        }
      }

      // Asignar a la primera columna disponible
      if (overlappingColumns.length === 0) {
        current.column = 0
        console.log(`  → Assigned to column 0 (no overlaps)`)
      } else {
        overlappingColumns.sort((a, b) => a - b)
        let targetColumn = 0
        for (const col of overlappingColumns) {
          if (col === targetColumn) {
            targetColumn++
          } else {
            break
          }
        }
        current.column = targetColumn
        console.log(`  → Assigned to column ${targetColumn} (overlapping columns: ${overlappingColumns.join(", ")})`)
      }
    }

    // Calcular totalColumns para cada grupo de solapamiento
    for (let i = 0; i < positioned.length; i++) {
      const current = positioned[i]
      let maxColumn = current.column

      // Buscar todas las citas que se solapan o son adyacentes
      for (let j = 0; j < positioned.length; j++) {
        if (i !== j) {
          const other = positioned[j]
          if (current.startTime <= other.endTime && other.startTime <= current.endTime) {
            maxColumn = Math.max(maxColumn, other.column)
          }
        }
      }

      current.totalColumns = maxColumn + 1
    }

    positioned.forEach((apt) => {
      console.log(`[v0] Appointment at ${format(new Date(apt.scheduledAt), "HH:mm")}:`, {
        column: apt.column,
        totalColumns: apt.totalColumns,
        duration: apt.duration,
        contactName: apt.contactName,
      })
    })

    return positioned
  }

  const positionedAppointments = calculateAppointmentColumns(dayAppointments)

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Columna de horas */}
            <div className="w-20 border-r bg-muted/30">
              {hours.map((hour) => (
                <div key={hour} className="h-30 border-b flex items-start justify-center pt-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Timeline de citas */}
            <div className="flex-1 relative min-h-[1800px]">
              {/* Líneas horizontales */}
              {hours.map((hour) => (
                <div key={hour} className="absolute left-0 right-0 h-30 border-b" style={{ top: (hour - 7) * 120 }} />
              ))}

              {/* Bloques de citas */}
              {positionedAppointments.map((apt) => {
                const aptDate = new Date(apt.scheduledAt)
                const endTime = new Date(aptDate.getTime() + apt.duration * 60000)

                const widthPercent = 100 / apt.totalColumns
                const leftPercent = apt.column * widthPercent
                // Spacing between columns
                const gap = 2

                console.log(`[v0] Rendering appointment at ${format(aptDate, "HH:mm")}:`, {
                  column: apt.column,
                  totalColumns: apt.totalColumns,
                  leftPercent,
                  widthPercent,
                  left: `calc(${leftPercent}% + ${gap}px)`,
                  width: `calc(${widthPercent}% - ${gap * 2}px)`,
                })

                return (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className={`absolute rounded-lg border-l-4 transition-all hover:shadow-md hover:z-10 cursor-pointer ${getStatusBgColor(
                      apt.status,
                    )}`}
                    style={{
                      top: `${apt.top}px`,
                      height: `${Math.max(apt.height, 50)}px`,
                      left: `calc(${leftPercent}% + ${gap}px)`,
                      width: `calc(${widthPercent}% - ${gap * 2}px)`,
                    }}
                  >
                    <div className="flex flex-col h-full text-left gap-0.5 overflow-hidden p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="text-xs font-semibold whitespace-nowrap">
                              {format(aptDate, "HH:mm")} - {format(endTime, "HH:mm")}
                            </span>
                            <Badge className={`${getStatusColor(apt.status)} text-[10px] px-1 py-0`} variant="outline">
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {apt.contactName || apt.client?.name || "Sin nombre"}
                            </span>
                          </div>
                          {apt.property && (
                            <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="text-xs truncate">{apt.property.title}</span>
                            </div>
                          )}
                          {apt.otherLocation && (
                            <div className="flex items-start gap-1.5 mb-0.5 min-w-0">
                              <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                              <span className="text-xs text-muted-foreground line-clamp-2">{apt.otherLocation}</span>
                            </div>
                          )}
                          {!apt.otherLocation && apt.property?.city && (
                            <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="text-xs text-muted-foreground truncate">{apt.property.city}</span>
                            </div>
                          )}
                          {apt.agent && (
                            <div className="flex items-center gap-1.5 mt-0.5 pt-0.5 border-t border-current/10 min-w-0">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="text-[10px] text-muted-foreground truncate">
                                Agente: {apt.agent.name}
                              </span>
                            </div>
                          )}
                        </div>
                        {apt.agent && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-[10px]">{getInitials(apt.agent.name)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}

              {/* Mensaje cuando no hay citas */}
              {dayAppointments.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No hay citas programadas para este día</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel lateral con detalles */}
      <Sheet open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedAppointment && (
            <>
              <SheetHeader>
                <SheetTitle>Detalles de la Cita</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Estado */}
                <div>
                  <Badge className={getStatusColor(selectedAppointment.status)} variant="outline">
                    {selectedAppointment.status}
                  </Badge>
                </div>

                {/* Fecha y hora */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Fecha y Hora</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {format(new Date(selectedAppointment.scheduledAt), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                  <p className="text-base">
                    {getArgentinaTime(selectedAppointment.scheduledAt)} ({selectedAppointment.duration} min)
                  </p>
                </div>

                {/* Cliente */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Cliente</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(selectedAppointment.contactName || selectedAppointment.client?.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">
                      {selectedAppointment.contactName || selectedAppointment.client?.name || "Sin nombre"}
                    </p>
                  </div>
                </div>

                {/* Propiedad */}
                {selectedAppointment.property && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Propiedad</span>
                    </div>
                    <Link href={`/catalog/${selectedAppointment.property.id}`}>
                      <Card className="overflow-hidden hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex gap-3 p-3">
                          {selectedAppointment.property.images?.[0] && (
                            <img
                              src={selectedAppointment.property.images[0] || "/placeholder.svg"}
                              alt={selectedAppointment.property.title}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{selectedAppointment.property.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {selectedAppointment.property.address}
                            </p>
                            <p className="text-sm font-semibold text-primary mt-1">
                              ${selectedAppointment.property.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                )}

                {/* Ubicación alternativa */}
                {selectedAppointment.otherLocation && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Otro Lugar</span>
                    </div>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedAppointment.otherLocation}</p>
                  </div>
                )}

                {/* Agente */}
                {selectedAppointment.agent && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Agente asignado</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(selectedAppointment.agent.name)}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold">{selectedAppointment.agent.name}</p>
                    </div>
                  </div>
                )}

                {/* Notas */}
                {selectedAppointment.notes && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">Notas</p>
                    <p className="text-sm bg-muted p-3 rounded-lg">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-4 border-t">
                  <Link href={`/appointments/${selectedAppointment.id}/edit`} className="flex-1">
                    <Button className="w-full" variant="default">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                  <DeleteAppointmentButton
                    appointmentId={selectedAppointment.id}
                    clientName={selectedAppointment.contactName || selectedAppointment.client?.name || "Cliente"}
                    propertyTitle={selectedAppointment.property?.title}
                    variant="destructive"
                    size="default"
                    canDelete={canDelete}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
