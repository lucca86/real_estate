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
import { createProvince, updateProvince } from "@/lib/actions/locations"

interface ProvinceFormProps {
  province?: {
    id: string
    name: string
    countryId: string
    isActive: boolean
  }
  countries: Array<{ id: string; name: string }>
}

export function ProvinceForm({ province, countries }: ProvinceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countryId, setCountryId] = useState(province?.countryId || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("countryId", countryId)

    try {
      if (province) {
        await updateProvince(province.id, formData)
      } else {
        await createProvince(formData)
      }
      router.push("/locations")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al guardar la provincia")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Provincia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" defaultValue={province?.name} required placeholder="Buenos Aires" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="countryId">País *</Label>
            <Select value={countryId} onValueChange={setCountryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Estado</Label>
              <p className="text-sm text-muted-foreground">Activa o desactiva esta provincia</p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={province?.isActive ?? true} />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : province ? "Actualizar" : "Crear"}
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
