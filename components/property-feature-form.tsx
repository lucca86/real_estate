"use client"

import type React from "react"

import type { PropertyFeature } from "@/lib/actions/property-features"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { useState } from "react"

type PropertyFeatureFormProps = {
  feature?: PropertyFeature
  action?: (formData: FormData) => Promise<void>
}

export function PropertyFeatureForm({ feature, action }: PropertyFeatureFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      if (action) {
        await action(formData)
      } else {
        const { createPropertyFeature } = await import("@/lib/actions/property-features")
        await createPropertyFeature(formData)
        router.push("/property-features")
      }
    } catch (error) {
      console.error("Error saving feature:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" placeholder="Ej: Jardín, Piscina, etc." defaultValue={feature?.name} required />
      </div>

      <div>
        <Label>Tipo</Label>
        <RadioGroup name="type" defaultValue={feature?.type || "CARACTERISTICA"} required>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="CARACTERISTICA" id="caracteristica" />
            <Label htmlFor="caracteristica">Característica</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="AMENIDAD" id="amenidad" />
            <Label htmlFor="amenidad">Amenidad</Label>
          </div>
        </RadioGroup>
      </div>

      {feature && <input type="hidden" name="is_active" value={feature.is_active.toString()} />}

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : feature ? "Actualizar" : "Crear"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
