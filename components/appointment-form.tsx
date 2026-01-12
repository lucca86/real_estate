"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createAppointment, updateAppointment } from "@/lib/actions/appointments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { datetimeLocalToISO, dateToDatetimeLocal } from "@/lib/timezone-utils"

const AppointmentStatus = {
  PENDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  COMPLETADA: "COMPLETADA",
  CANCELADA: "CANCELADA",
} as const

type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus]

const appointmentSchema = z
  .object({
    propertyId: z.string().optional(),
    otherLocation: z.string().optional(),
    contactName: z.string().min(1, "Ingresa el nombre del contacto"),
    agentId: z.string().min(1, "Selecciona un agente"),
    scheduledAt: z.string().min(1, "Selecciona fecha y hora"),
    duration: z.number().min(15).max(480),
    status: z.nativeEnum(AppointmentStatus),
    notes: z.string().optional(),
  })
  .refine((data) => data.propertyId || data.otherLocation, {
    message: "Debes seleccionar una propiedad o ingresar otro lugar",
    path: ["propertyId"],
  })

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  appointment?: any
  properties: Array<{ id: string; title: string; address: string; city: string }>
  clients: Array<{ id: string; name: string; email: string | null; phone: string | null }>
  agents: Array<{ id: string; name: string; email: string | null }>
}

export function AppointmentForm({ appointment, properties, clients, agents }: AppointmentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [propertySearch, setPropertySearch] = useState("")
  const [showPropertyResults, setShowPropertyResults] = useState(false)

  const now = new Date()
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  const initialProperty = appointment?.property_id
    ? properties.find((p) => p.id === appointment.property_id) ||
      (appointment.property
        ? {
            id: appointment.property.id,
            title: appointment.property.title,
            address: appointment.property.address,
            city: "Sin ciudad",
          }
        : null)
    : null

  const [selectedProperty, setSelectedProperty] = useState<{
    id: string
    title: string
    address: string
    city: string
  } | null>(initialProperty)

  useEffect(() => {
    if (initialProperty) {
      setPropertySearch(initialProperty.address)
    }
  }, [initialProperty])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment
      ? {
          propertyId: appointment.property_id || "",
          otherLocation: appointment.other_location || "",
          contactName: appointment.contact_name || appointment.client?.name || "",
          agentId: appointment.agent_id || "",
          scheduledAt: dateToDatetimeLocal(appointment.scheduled_date),
          duration: appointment.duration,
          status: appointment.status,
          notes: appointment.notes || "",
        }
      : {
          propertyId: "",
          otherLocation: "",
          contactName: "",
          agentId: "",
          scheduledAt: "",
          duration: 60,
          status: "PENDIENTE" as AppointmentStatus,
          notes: "",
        },
  })

  const filteredProperties = propertySearch.trim()
    ? properties.filter(
        (property) =>
          property.address.toLowerCase().includes(propertySearch.toLowerCase()) ||
          property.city.toLowerCase().includes(propertySearch.toLowerCase()),
      )
    : []

  const onSubmit = async (data: AppointmentFormData) => {
    console.log("[v0] Form submitted with data:", data)
    setIsSubmitting(true)

    try {
      const scheduledAtISO = datetimeLocalToISO(data.scheduledAt)
      console.log("[v0] Scheduled time converted to ISO:", scheduledAtISO)

      const appointmentData = {
        ...data,
        scheduledAt: scheduledAtISO,
      }

      console.log("[v0] Sending appointment data:", appointmentData)

      const result = appointment
        ? await updateAppointment(appointment.id, appointmentData)
        : await createAppointment(appointmentData)

      if (result.success) {
        toast({
          title: appointment ? "Cita actualizada" : "Cita creada",
          description: appointment
            ? "La cita ha sido actualizada exitosamente. Se han enviado notificaciones por email."
            : "La cita ha sido agendada exitosamente. Se han enviado notificaciones por email.",
        })
        router.push("/appointments")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Ocurrió un error",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Cita</CardTitle>
          <CardDescription>Información sobre la visita a la propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertySearch" className={errors.propertyId ? "text-destructive" : ""}>
              Propiedad
            </Label>
            <div className="relative">
              <Input
                id="propertySearch"
                type="text"
                placeholder="Busca por dirección..."
                value={selectedProperty ? `${selectedProperty.address}, ${selectedProperty.city}` : propertySearch}
                onChange={(e) => {
                  setPropertySearch(e.target.value)
                  setShowPropertyResults(true)
                  if (selectedProperty) {
                    setSelectedProperty(null)
                    setValue("propertyId", "")
                  }
                }}
                onFocus={() => setShowPropertyResults(true)}
                className={errors.propertyId ? "border-destructive" : ""}
              />
              {showPropertyResults && !selectedProperty && filteredProperties.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredProperties.map((property) => (
                    <button
                      key={property.id}
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm"
                      onClick={() => {
                        setSelectedProperty(property)
                        setValue("propertyId", property.id)
                        setPropertySearch("")
                        setShowPropertyResults(false)
                      }}
                    >
                      <div className="font-medium">{property.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {property.address}, {property.city}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.propertyId && <p className="text-sm text-destructive">{errors.propertyId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="otherLocation">Otro lugar</Label>
            <Input
              id="otherLocation"
              type="text"
              placeholder="Ej: Café Central, Oficina, etc."
              {...register("otherLocation")}
            />
            <p className="text-xs text-muted-foreground">
              Si la cita no es en una propiedad, ingresa el lugar donde se realizará
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName" className={errors.contactName ? "text-destructive" : ""}>
              Contacto *
            </Label>
            <Input
              id="contactName"
              type="text"
              placeholder="Nombre del contacto"
              {...register("contactName")}
              className={errors.contactName ? "border-destructive" : ""}
            />
            {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
            <p className="text-xs text-muted-foreground">Ingresa el nombre de la persona interesada en la propiedad</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentId" className={errors.agentId ? "text-destructive" : ""}>
              Agente Asignado *
            </Label>
            <Select value={watch("agentId")} onValueChange={(value) => setValue("agentId", value)}>
              <SelectTrigger className={errors.agentId ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecciona un agente" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} {agent.email && `(${agent.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.agentId && <p className="text-sm text-destructive">{errors.agentId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt" className={errors.scheduledAt ? "text-destructive" : ""}>
                Fecha y Hora *
              </Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                min={minDateTime}
                {...register("scheduledAt")}
                className={errors.scheduledAt ? "border-destructive" : ""}
              />
              {errors.scheduledAt && <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>}
              <p className="text-xs text-muted-foreground">Horario: Lun-Vie 7:30-12:30 y 16:30-20:30, Sáb 9:00-12:00</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className={errors.duration ? "text-destructive" : ""}>
                Duración (minutos) *
              </Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="480"
                step="15"
                {...register("duration", { valueAsNumber: true })}
                className={errors.duration ? "border-destructive" : ""}
              />
              {errors.duration && <p className="text-sm text-destructive">{errors.duration.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={watch("status")} onValueChange={(value) => setValue("status", value as AppointmentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                <SelectItem value="COMPLETADA">Completada</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" placeholder="Notas adicionales sobre la cita..." {...register("notes")} rows={4} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {appointment ? "Actualizar Cita" : "Crear Cita"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
