"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCity, updateCity, checkDuplicateCity } from "@/lib/actions/locations"
import { AlertCircle } from "lucide-react"

interface CityFormProps {
  city?: {
    id: string
    name: string
    provinceId: string
    isActive: boolean
  }
  provinces: Array<{ id: string; name: string; country: { id: string; name: string } }>
  countries: Array<{ id: string; name: string }>
}

export function CityForm({ city, provinces, countries }: CityFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedCountryId, setSelectedCountryId] = useState("")
  const [provinceId, setProvinceId] = useState(city?.provinceId || "")
  const [name, setName] = useState(city?.name || "")

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)

  useEffect(() => {
    if (city?.provinceId) {
      const province = provinces.find((p) => p.id === city.provinceId)
      if (province) {
        setSelectedCountryId(province.country.id)
      }
    }
  }, [city, provinces])

  useEffect(() => {
    if (!name || !provinceId) {
      setDuplicateWarning(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingDuplicate(true)
      const isDuplicate = await checkDuplicateCity(name, provinceId, city?.id)

      if (isDuplicate) {
        setDuplicateWarning(
          `Ya existe una ciudad llamada "${name}" en esta provincia. ¿Deseas continuar de todas formas?`,
        )
      } else {
        setDuplicateWarning(null)
      }
      setIsCheckingDuplicate(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [name, provinceId, city?.id])

  const filteredProvinces = selectedCountryId
    ? provinces.filter((province) => province.country.id === selectedCountryId)
    : []

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!selectedCountryId) {
      setError("Por favor selecciona un país")
      return
    }
    if (!provinceId) {
      setError("Por favor selecciona una provincia")
      return
    }

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
            <Label htmlFor="name">Nombre de la Ciudad *</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Corrientes"
            />
            {isCheckingDuplicate && <p className="text-xs text-muted-foreground">Verificando disponibilidad...</p>}
          </div>

          {duplicateWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="countryId">País *</Label>
            <Select
              value={selectedCountryId}
              onValueChange={(value) => {
                setSelectedCountryId(value)
                setProvinceId("") // Reset province when country changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un país..." />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Selecciona el país para filtrar las provincias disponibles</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provinceId">Provincia *</Label>
            <Select value={provinceId} onValueChange={setProvinceId} disabled={!selectedCountryId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={selectedCountryId ? "Selecciona una provincia..." : "Primero selecciona un país"}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredProvinces.map((province) => (
                  <SelectItem key={province.id} value={province.id}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedCountryId
                ? `Mostrando ${filteredProvinces.length} provincia${filteredProvinces.length !== 1 ? "s" : ""} en el país seleccionado`
                : "Selecciona un país para ver las provincias disponibles"}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Estado</Label>
              <p className="text-sm text-muted-foreground">Activa o desactiva esta ciudad</p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={city?.isActive ?? true} />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting || isCheckingDuplicate}>
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
