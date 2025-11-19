"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'
import { createPropertyType, updatePropertyType } from "@/lib/actions/property-types"

interface PropertyType {
  id?: string
  name?: string
  description?: string | null
  isActive?: boolean
}

interface PropertyTypeFormProps {
  propertyType?: PropertyType
}

export function PropertyTypeForm({ propertyType }: PropertyTypeFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      if (propertyType) {
        if (!propertyType.id) {
          throw new Error("ID de tipo de propiedad no válido")
        }
        await updatePropertyType(propertyType.id, formData)
      } else {
        await createPropertyType(formData)
      }
      router.push("/property-types")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Tipo de Propiedad</CardTitle>
          <CardDescription>Datos del tipo de propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={propertyType?.name}
              required
              disabled={isLoading}
              placeholder="Ej: Casa, Apartamento, Terreno"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={propertyType?.description || ""}
              disabled={isLoading}
              placeholder="Descripción opcional del tipo de propiedad"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Activo</Label>
              <p className="text-sm text-muted-foreground">El tipo de propiedad está disponible para usar</p>
            </div>
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={propertyType?.isActive ?? true}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {propertyType ? "Actualizar" : "Crear"} Tipo de Propiedad
        </Button>
      </div>
    </form>
  )
}
