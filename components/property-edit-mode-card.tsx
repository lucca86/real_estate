"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { updateSystemSetting } from "@/lib/actions/system-settings"
import { Lock, Users, CheckCircle } from "lucide-react"

interface PropertyEditModeCardProps {
  currentMode: "open" | "restricted"
}

export function PropertyEditModeCard({ currentMode }: PropertyEditModeCardProps) {
  const [mode, setMode] = useState<"open" | "restricted">(currentMode)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSystemSetting("property_edit_mode", mode)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  const hasChanged = mode !== currentMode

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Modo de Edición de Propiedades
        </CardTitle>
        <CardDescription>
          Controla quién puede editar y eliminar propiedades en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={mode}
          onValueChange={(v) => {
            setMode(v as "open" | "restricted")
            setSaved(false)
          }}
          className="space-y-4"
        >
          {/* Open mode */}
          <label
            htmlFor="mode-open"
            className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
              mode === "open" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
            }`}
          >
            <RadioGroupItem value="open" id="mode-open" className="mt-0.5" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">Abierto</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cualquier usuario con permiso de edición puede editar o eliminar cualquier propiedad del sistema, independientemente de quién la creó.
              </p>
            </div>
          </label>

          {/* Restricted mode */}
          <label
            htmlFor="mode-restricted"
            className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
              mode === "restricted" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
            }`}
          >
            <RadioGroupItem value="restricted" id="mode-restricted" className="mt-0.5" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="font-medium">Restringido</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cada usuario solo puede editar o eliminar las propiedades que él mismo creó. Los administradores y supervisores pueden editar cualquier propiedad.
              </p>
            </div>
          </label>
        </RadioGroup>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isPending || (!hasChanged && !saved)}>
            {isPending ? "Guardando..." : saved ? "Guardado" : "Guardar cambio"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Configuración actualizada
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
