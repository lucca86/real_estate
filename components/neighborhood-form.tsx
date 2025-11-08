"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createNeighborhood, updateNeighborhood } from "@/lib/actions/locations"

interface NeighborhoodFormProps {
  neighborhood?: {
    id: string
    name: string
    cityId: string
    isActive: boolean
  }
  cities: Array<{ id: string; name: string; province: { name: string } }>
}

export function NeighborhoodForm({ neighborhood, cities }: NeighborhoodFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cityId, setCityId] = useState(neighborhood?.cityId || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("cityId", cityId)

    try {
      if (neighborhood) {
        await updateNeighborhood(neighborhood.id, formData)
      } else {
        await createNeighborhood(formData)
      }
      router.push("/locations")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al guardar el barrio")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del Barrio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" defaultValue={neighborhood?.name} required placeholder="Centro" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cityId">Ciudad *</Label>
            <Select value={cityId} onValueChange={setCityId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una ciudad" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name} ({city.province.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Estado</Label>
              <p className="text-sm text-muted-foreground">Activa o desactiva este barrio</p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={neighborhood?.isActive ?? true} />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : neighborhood ? "Actualizar" : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/locations")} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
