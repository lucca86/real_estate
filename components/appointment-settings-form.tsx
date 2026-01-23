"use client"

import React from "react"

import { useState } from "react"
import { updateAppointmentSetting, type AppointmentSetting } from "@/lib/actions/appointment-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface AppointmentSettingsFormProps {
  settings: AppointmentSetting[]
}

const DAY_TYPE_LABELS = {
  WEEKDAY: "Lunes a Viernes",
  SATURDAY: "Sábados",
  HOLIDAY: "Feriados",
}

export function AppointmentSettingsForm({ settings }: AppointmentSettingsFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, settingId: string) => {
    e.preventDefault()
    setIsSubmitting(settingId)

    // Obtener el setting actual del estado
    const setting = localSettings.find(s => s.id === settingId)
    if (!setting) return

    // Construir FormData manualmente con los valores del estado
    const formData = new FormData()
    formData.append("is_open", setting.is_open ? "true" : "false")
    formData.append("start_time", setting.start_time || "")
    formData.append("end_time", setting.end_time || "")
    formData.append("min_duration", setting.min_duration.toString())
    formData.append("max_duration", setting.max_duration.toString())
    formData.append("duration_interval", setting.duration_interval.toString())

    console.log("[v0] Submitting settings:", {
      id: settingId,
      is_open: setting.is_open,
      start_time: setting.start_time,
      end_time: setting.end_time,
      min_duration: setting.min_duration,
      max_duration: setting.max_duration,
      duration_interval: setting.duration_interval,
    })

    const result = await updateAppointmentSetting(settingId, formData)

    if (result.success) {
      toast({
        title: "Configuración actualizada",
        description: "Los horarios se actualizaron correctamente",
      })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsSubmitting(null)
  }

  const updateLocalSetting = (id: string, field: string, value: any) => {
    setLocalSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  return (
    <div className="space-y-8">
      {localSettings.map((setting) => {
        const isOpen = setting.is_open

        return (
          <form
            key={setting.id}
            onSubmit={(e) => handleSubmit(e, setting.id)}
            className="space-y-4 border-b pb-6 last:border-b-0"
          >
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {DAY_TYPE_LABELS[setting.day_type]}
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Estado Abierto/Cerrado */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor={`is_open_${setting.id}`}>Estado</Label>
                    <p className="text-sm text-muted-foreground">
                      {isOpen ? "Abierto para citas" : "Cerrado"}
                    </p>
                  </div>
                  <Switch
                    id={`is_open_${setting.id}`}
                    checked={isOpen}
                    onCheckedChange={(checked) => {
                      updateLocalSetting(setting.id, "is_open", checked)
                    }}
                  />
                </div>
              </div>

              {/* Horarios */}
              {isOpen && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`start_time_${setting.id}`}>Hora de Inicio</Label>
                    <Input
                      id={`start_time_${setting.id}`}
                      type="time"
                      value={setting.start_time || "09:00"}
                      onChange={(e) => updateLocalSetting(setting.id, "start_time", e.target.value)}
                      required={isOpen}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`end_time_${setting.id}`}>Hora de Fin</Label>
                    <Input
                      id={`end_time_${setting.id}`}
                      type="time"
                      value={setting.end_time || "18:00"}
                      onChange={(e) => updateLocalSetting(setting.id, "end_time", e.target.value)}
                      required={isOpen}
                    />
                  </div>
                </>
              )}

              {/* Duración de Citas */}
              <div className="space-y-2">
                <Label htmlFor={`min_duration_${setting.id}`}>Duración Mínima (minutos)</Label>
                <Input
                  id={`min_duration_${setting.id}`}
                  type="number"
                  min="5"
                  max="480"
                  step="1"
                  value={setting.min_duration}
                  onChange={(e) => updateLocalSetting(setting.id, "min_duration", Number.parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">Mínimo: 5 minutos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`max_duration_${setting.id}`}>Duración Máxima (minutos)</Label>
                <Input
                  id={`max_duration_${setting.id}`}
                  type="number"
                  min="5"
                  max="480"
                  step="1"
                  value={setting.max_duration}
                  onChange={(e) => updateLocalSetting(setting.id, "max_duration", Number.parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">Máximo: 480 minutos (8 horas)</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`duration_interval_${setting.id}`}>Intervalos (minutos)</Label>
                <Input
                  id={`duration_interval_${setting.id}`}
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  value={setting.duration_interval}
                  onChange={(e) => updateLocalSetting(setting.id, "duration_interval", Number.parseInt(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Los horarios se mostrarán en intervalos de estos minutos (1-60)
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting === setting.id}>
                {isSubmitting === setting.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        )
      })}
    </div>
  )
}
