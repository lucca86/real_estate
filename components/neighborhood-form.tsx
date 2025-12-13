"use client"

import type React from "react"
import { useState, useTransition, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createNeighborhood, updateNeighborhood } from "@/lib/actions/locations"
import { checkDuplicateNeighborhood } from "@/lib/actions/locations"
import { AlertCircle } from "lucide-react"

interface NeighborhoodFormProps {
  neighborhood?: {
    id: string
    name: string
    cityId: string
    isActive: boolean
  }
  cities: Array<{
    id: string
    name: string
    province: {
      id: string
      name: string
      country: {
        id: string
        name: string
      }
    }
  }>
  provinces: Array<{
    id: string
    name: string
    country: {
      id: string
      name: string
    }
  }>
}

export function NeighborhoodForm({ neighborhood, cities, provinces }: NeighborhoodFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(neighborhood?.name || "")
  const [cityId, setCityId] = useState(neighborhood?.cityId || "")
  const [selectedProvinceId, setSelectedProvinceId] = useState("")
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const filteredCities = useMemo(() => {
    return selectedProvinceId ? cities.filter((city) => city.province.id === selectedProvinceId) : []
  }, [cities, selectedProvinceId])

  useEffect(() => {
    if (neighborhood?.cityId && cities.length > 0) {
      const city = cities.find((c) => c.id === neighborhood.cityId)
      if (city) {
        setSelectedProvinceId(city.province.id)
      }
    }
  }, [neighborhood?.cityId, cities])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name || !cityId) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        if (neighborhood) {
          await updateNeighborhood(neighborhood.id, formData)
        } else {
          await createNeighborhood(formData)
        }
        router.push("/locations/neighborhoods")
        router.refresh()
      } catch (error) {
        console.error("Error saving neighborhood:", error)
        alert("Error al guardar el barrio")
      }
    })
  }

  useEffect(() => {
    const checkDuplicate = async () => {
      if (!name || !cityId) {
        setDuplicateWarning(null)
        return
      }

      const isDuplicate = await checkDuplicateNeighborhood(
        name,
        cityId,
        neighborhood?.id, // Exclude current neighborhood when editing
      )

      setDuplicateWarning(
        isDuplicate ? `Ya existe un barrio llamado "${name}" en esta ciudad. ¿Deseas continuar de todas formas?` : null,
      )
    }

    // Debounce the check to avoid too many requests
    const timeoutId = setTimeout(checkDuplicate, 500)
    return () => clearTimeout(timeoutId)
  }, [name, cityId, neighborhood?.id])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Barrio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {duplicateWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Barrio *</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Centro"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provinceId">Provincia *</Label>
            <Select
              value={selectedProvinceId}
              onValueChange={(value) => {
                setSelectedProvinceId(value)
                setCityId("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una provincia..." />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name} {province.country ? `(${province.country.name})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecciona la provincia para filtrar las ciudades disponibles
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cityId">Ciudad *</Label>
            <input type="hidden" name="cityId" value={cityId} />
            <Select value={cityId} onValueChange={setCityId} disabled={!selectedProvinceId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={selectedProvinceId ? "Selecciona una ciudad..." : "Primero selecciona una provincia"}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredCities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedProvinceId
                ? `Mostrando ${filteredCities.length} ciudad${filteredCities.length !== 1 ? "es" : ""} en la provincia seleccionada`
                : "Selecciona una provincia para ver las ciudades disponibles"}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Estado</Label>
              <p className="text-sm text-muted-foreground">Activa o desactiva este barrio</p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={neighborhood?.isActive ?? true} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending || !cityId}>
          {isPending ? "Guardando..." : neighborhood ? "Actualizar" : "Crear"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
