"use client"

import { useState } from "react"
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
import { AppointmentStatus } from "@prisma/client"
import { datetimeLocalToISO, dateToDatetimeLocal } from "@/lib/timezone-utils"

const appointmentSchema = z.object({
  propertyId: z.string().min(1, "Selecciona una propiedad"),
  clientId: z.string().min(1, "Selecciona un cliente"),
  agentId: z.string().min(1, "Selecciona un agente"),
  scheduledAt: z.string().min(1, "Selecciona fecha y hora"),
  duration: z.number().min(15).max(480),
  status: z.nativeEnum(AppointmentStatus),
  notes: z.string().optional(),
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
          propertyId: appointment.propertyId,
          clientId: appointment.clientId,
          agentId: appointment.agentId,
          scheduledAt: dateToDatetimeLocal(appointment.scheduledAt),
          duration: appointment.duration,
          status: appointment.status,
          notes: appointment.notes || "",
        }
      : {
          propertyId: "",
          clientId: "",
          agentId: "",
          scheduledAt: "",
          duration: 60,
          status: "PENDIENTE" as AppointmentStatus,
          notes: "",
        },
  })

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true)

    try {
      const scheduledAtISO = datetimeLocalToISO(data.scheduledAt)

      const appointmentData = {
        ...data,
        scheduledAt: scheduledAtISO,
      }

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
            <Label htmlFor="propertyId" className={errors.propertyId ? "text-destructive" : ""}>
              Propiedad *
            </Label>
            <Select value={watch("propertyId")} onValueChange={(value) => setValue("propertyId", value)}>
              <SelectTrigger className={errors.propertyId ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecciona una propiedad" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.address}, {property.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyId && <p className="text-sm text-destructive">{errors.propertyId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId" className={errors.clientId ? "text-destructive" : ""}>
              Cliente *
            </Label>
            <Select value={watch("clientId")} onValueChange={(value) => setValue("clientId", value)}>
              <SelectTrigger className={errors.clientId ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.email && `- ${client.email}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
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
                    {agent.name} {agent.email && `- ${agent.email}`}
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
