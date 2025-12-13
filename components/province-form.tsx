"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProvince, updateProvince, checkDuplicateProvince } from "@/lib/actions/locations"
import { AlertCircle } from "lucide-react"

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
  const [name, setName] = useState(province?.name || "")
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)

  useEffect(() => {
    if (!name || !countryId || name.length < 2) {
      setIsDuplicate(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsDuplicateChecking(true)
      const duplicate = await checkDuplicateProvince(name, countryId, province?.id)
      setIsDuplicate(duplicate)
      setIsDuplicateChecking(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [name, countryId, province?.id])

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

          {isDuplicate && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Ya existe una provincia con este nombre en el país seleccionado</p>
                <p className="mt-1 text-xs">
                  Puedes continuar si estás seguro de que son diferentes, pero te recomendamos verificar primero.
                </p>
              </div>
            </div>
          )}

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
            <p className="text-xs text-muted-foreground">Selecciona el país para filtrar las opciones</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre * {isDuplicateChecking && <span className="text-xs text-muted-foreground">(verificando...)</span>}
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Buenos Aires"
            />
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
