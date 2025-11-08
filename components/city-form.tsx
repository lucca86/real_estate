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
import { createCity, updateCity } from "@/lib/actions/locations"

interface CityFormProps {
  city?: {
    id: string
    name: string
    provinceId: string
    isActive: boolean
  }
  provinces: Array<{ id: string; name: string; country: { name: string } }>
}

export function CityForm({ city, provinces }: CityFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provinceId, setProvinceId] = useState(city?.provinceId || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("provinceId", provinceId)

    try {
      if (city) {
        await updateCity(city.id, formData)
      } else {
        await createCity(formData)
      }
      router.push("/locations")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al guardar la ciudad")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Ciudad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" defaultValue={city?.name} required placeholder="Corrientes" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provinceId">Provincia *</Label>
            <Select value={provinceId} onValueChange={setProvinceId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una provincia" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name} ({province.country.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Estado</Label>
              <p className="text-sm text-muted-foreground">Activa o desactiva esta ciudad</p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={city?.isActive ?? true} />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : city ? "Actualizar" : "Crear"}
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
