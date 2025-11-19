"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, Sparkles, Plus } from 'lucide-react'
import { createProperty, updateProperty } from "@/lib/actions/properties"
import { geocodeAddress } from "@/lib/geocoding"
import { generatePropertyTitle } from "@/lib/actions/ai-property-title"
import { useToast } from "@/hooks/use-toast"
import { PropertiesMap } from "@/components/property-map"
import { CreateOwnerDialog } from "@/components/create-owner-dialog"
import { getCountries, getProvinces, getCities, getNeighborhoods } from "@/lib/actions/locations"

interface Property {
  id?: string
  title?: string
  description?: string | null
  ownerId?: string
  owner?: { id: string; name: string }
  propertyTypeId?: string
  status?: string
  address?: string
  city?: string
  country?: string
  state?: string
  countryId?: string | null
  provinceId?: string | null
  cityId?: string | null
  neighborhoodId?: string | null
  latitude?: number | null
  longitude?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  parkingSpaces?: number | null
  area?: number
  yearBuilt?: number | null
  price?: number
  currency?: string | null
  amenities?: string[]
  images?: string[]
  isFeatured?: boolean
  featured?: boolean
  views?: number
  wordpressId?: number | null
  syncedAt?: string | null
  createdById?: string | null
  syncToWordPress?: boolean
  adrema?: string | null
  transactionType?: string
  rentalPeriod?: string | null
  zipCode?: string | null
  lotSize?: number | null
  pricePerM2?: number | null
  rentalPrice?: number | null
  virtualTour?: string | null
  propertyLabel?: string | null
  published?: boolean
  features?: string[]
  videos?: string[]
  createdAt?: Date
  updatedAt?: Date
}

interface PropertyFormProps {
  editProperty?: Property
}

export function PropertyForm({ editProperty }: PropertyFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geocodingMessage, setGeocodingMessage] = useState<string | null>(null)
  const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([])
  const [propertyTypes, setPropertyTypes] = useState<Array<{ id: string; name: string }>>([])
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(
    editProperty?.latitude && editProperty?.longitude
      ? { lat: editProperty.latitude, lng: editProperty.longitude }
      : null,
  )
  const { toast } = useToast()
  const [showCreateOwner, setShowCreateOwner] = useState(false)

  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([])
  const [provinces, setProvinces] = useState<Array<{ id: string; name: string }>>([])
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([])
  const [neighborhoods, setNeighborhoods] = useState<Array<{ id: string; name: string }>>([])

  const [selectedCountryId, setSelectedCountryId] = useState<string | undefined>(editProperty?.countryId || undefined)
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | undefined>(
    editProperty?.provinceId || undefined,
  )
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>(editProperty?.cityId || undefined)

  useEffect(() => {
    // Save the current scroll position
    const scrollPosition = window.scrollY || window.pageYOffset

    // Restore scroll position after any potential auto-scroll
    const preventScroll = () => {
      window.scrollTo(0, scrollPosition)
    }

    // Run immediately and after a short delay to catch any delayed scrolls
    preventScroll()
    const timer = setTimeout(preventScroll, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [ownersResponse, propertyTypesResponse, countriesData] = await Promise.all([
          fetch("/api/owners"),
          fetch("/api/property-types"),
          getCountries(),
        ])

        if (ownersResponse.ok) {
          const ownersData = await ownersResponse.json()
          setOwners(ownersData)
        }

        if (propertyTypesResponse.ok) {
          const propertyTypesData = await propertyTypesResponse.json()
          setPropertyTypes(propertyTypesData)
        }

        setCountries(countriesData)

        if (editProperty?.countryId) {
          const provincesData = await getProvinces(editProperty.countryId)
          setProvinces(provincesData)
        }

        if (editProperty?.provinceId) {
          const citiesData = await getCities(editProperty.provinceId)
          setCities(citiesData)
        }

        if (editProperty?.cityId) {
          const neighborhoodsData = await getNeighborhoods(editProperty.cityId)
          setNeighborhoods(neighborhoodsData)
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
      }
    }
    fetchData()
  }, [editProperty])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      if (editProperty) {
        if (!editProperty.id) {
          throw new Error("ID de propiedad no válido")
        }
        await updateProperty(editProperty.id, formData)
        toast({
          title: "Propiedad actualizada",
          description: "La propiedad se ha actualizado exitosamente",
        })
      } else {
        await createProperty(formData)
        toast({
          title: "Propiedad creada",
          description: "La propiedad se ha creado exitosamente",
        })
      }
      router.push("/properties")
      router.refresh()
    } catch (err) {
      console.error("[v0] Error submitting form:", err)
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error al guardar la propiedad"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGeocodeAddress() {
    setGeocodingMessage(null)
    setIsGeocoding(true)

    try {
      const addressInput = document.getElementById("address") as HTMLInputElement
      const citySelect = document.querySelector('[name="cityId"]') as HTMLSelectElement
      const provinceSelect = document.querySelector('[name="provinceId"]') as HTMLSelectElement

      const address = addressInput?.value
      const cityName = cities.find((c) => c.id === citySelect?.value)?.name
      const provinceName = provinces.find((p) => p.id === provinceSelect?.value)?.name

      if (!address || !cityName || !provinceName) {
        setGeocodingMessage("Por favor complete la dirección, ciudad y provincia primero")
        setIsGeocoding(false)
        return
      }

      const fullAddress = `${address}, ${cityName}, ${provinceName}, Argentina`

      const result = await geocodeAddress(fullAddress)

      if (result) {
        const latitudeInput = document.getElementById("latitude") as HTMLInputElement
        const longitudeInput = document.getElementById("longitude") as HTMLInputElement

        if (latitudeInput && longitudeInput) {
          latitudeInput.value = result.latitude.toString()
          longitudeInput.value = result.longitude.toString()
          setMapCoordinates({ lat: result.latitude, lng: result.longitude })
          setGeocodingMessage(`Coordenadas calculadas exitosamente: ${result.latitude}, ${result.longitude}`)
        }
      } else {
        setGeocodingMessage("No se pudieron calcular las coordenadas. Verifique la dirección e intente nuevamente.")
      }
    } catch (err) {
      setGeocodingMessage("Error al calcular las coordenadas. Por favor intente nuevamente.")
      console.error("[v0] Geocoding error:", err)
    } finally {
      setIsGeocoding(false)
    }
  }

  async function handleGenerateTitle() {
    console.log("[v0] Generate title button clicked")
    setIsGeneratingTitle(true)

    try {
      const form = document.querySelector("form") as HTMLFormElement
      const formData = new FormData(form)

      const propertyTypeId = formData.get("propertyTypeId") as string
      const propertyTypeName = propertyTypes.find((t) => t.id === propertyTypeId)?.name || ""

      const cityId = formData.get("cityId") as string
      const provinceId = formData.get("provinceId") as string
      const cityName = cities.find((c) => c.id === cityId)?.name || ""
      const provinceName = provinces.find((p) => p.id === provinceId)?.name || ""

      const details = {
        propertyType: propertyTypeName,
        transactionType: formData.get("transactionType") as string,
        bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : undefined,
        bathrooms: formData.get("bathrooms") ? Number(formData.get("bathrooms")) : undefined,
        area: formData.get("area") ? Number(formData.get("area")) : undefined,
        city: cityName,
        state: provinceName,
        price: formData.get("price") ? Number(formData.get("price")) : undefined,
        currency: formData.get("currency") as string,
        features: formData.get("features")
          ? (formData.get("features") as string)
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean)
          : [],
        amenities: formData.get("amenities")
          ? (formData.get("amenities") as string)
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
      }

      console.log("[v0] Property details for AI:", details)

      const result = await generatePropertyTitle(details)

      console.log("[v0] AI result:", result)

      if (result.success && result.title) {
        const titleInput = document.getElementById("title") as HTMLInputElement
        if (titleInput) {
          titleInput.value = result.title
          console.log("[v0] Title set to:", result.title)
        }
        toast({
          title: "Título generado",
          description: "El título ha sido generado exitosamente con AI",
        })
      } else {
        console.error("[v0] AI generation failed:", result.error)
        toast({
          title: "Error",
          description: result.error || "No se pudo generar el título",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("[v0] Error in handleGenerateTitle:", err)
      toast({
        title: "Error",
        description: "Error al generar el título con AI",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingTitle(false)
      console.log("[v0] Generate title finished")
    }
  }

  async function handleOwnerCreated(newOwner: { id: string; name: string }) {
    setOwners((prev) => [...prev, newOwner])
    const ownerSelect = document.querySelector('[name="ownerId"]') as HTMLSelectElement
    if (ownerSelect) {
      ownerSelect.value = newOwner.id
    }
    toast({
      title: "Propietario creado",
      description: `${newOwner.name} ha sido agregado exitosamente`,
    })
  }

  async function handleCountryChange(countryId: string) {
    setSelectedCountryId(countryId)
    setSelectedProvinceId(undefined)
    setSelectedCityId(undefined)
    setProvinces([])
    setCities([])
    setNeighborhoods([])

    const provincesData = await getProvinces(countryId)
    setProvinces(provincesData)
  }

  async function handleProvinceChange(provinceId: string) {
    setSelectedProvinceId(provinceId)
    setSelectedCityId(undefined)
    setCities([])
    setNeighborhoods([])

    const citiesData = await getCities(provinceId)
    setCities(citiesData)
  }

  async function handleCityChange(cityId: string) {
    setSelectedCityId(cityId)
    setNeighborhoods([])

    const neighborhoodsData = await getNeighborhoods(cityId)
    setNeighborhoods(neighborhoodsData)
  }

  function handleCoordinateChange() {
    const latitudeInput = document.getElementById("latitude") as HTMLInputElement
    const longitudeInput = document.getElementById("longitude") as HTMLInputElement

    const lat = latitudeInput?.value ? Number.parseFloat(latitudeInput.value) : null
    const lng = longitudeInput?.value ? Number.parseFloat(longitudeInput.value) : null

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      setMapCoordinates({ lat, lng })
    } else {
      setMapCoordinates(null)
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
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>Datos principales de la propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <div className="flex gap-2">
              <Input
                id="title"
                name="title"
                defaultValue={editProperty?.title}
                required
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateTitle}
                disabled={isLoading || isGeneratingTitle}
                className="shrink-0 bg-transparent"
              >
                {isGeneratingTitle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Haz clic en el botón con la estrella para generar un título atractivo con AI
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={editProperty?.description ?? undefined}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerId">Propietario *</Label>
            <div className="flex gap-2">
              <Select name="ownerId" defaultValue={editProperty?.ownerId ?? undefined} disabled={isLoading} required>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccione un propietario" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  console.log("[v0] Create owner button clicked")
                  setShowCreateOwner(true)
                }}
                disabled={isLoading}
                title="Crear nuevo propietario"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {owners.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay propietarios disponibles. Haz clic en el botón + para crear uno nuevo.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="propertyTypeId">Tipo de Propiedad *</Label>
              <Select
                name="propertyTypeId"
                defaultValue={editProperty?.propertyTypeId ?? undefined}
                disabled={isLoading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {propertyTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay tipos de propiedad disponibles.{" "}
                  <a href="/property-types/new" className="text-primary hover:underline">
                    Crear uno nuevo
                  </a>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionType">Tipo de Transacción</Label>
              <Select
                name="transactionType"
                defaultValue={editProperty?.transactionType || "VENTA"}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENTA">Venta</SelectItem>
                  <SelectItem value="ALQUILER">Alquiler</SelectItem>
                  <SelectItem value="VENTA_ALQUILER">Venta/Alquiler</SelectItem>
                  <SelectItem value="ALQUILER_OPCION_COMPRA">Alquiler con opción a compra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select name="status" defaultValue={editProperty?.status || "ACTIVO"} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="ALQUILADO">Alquilado</SelectItem>
                  <SelectItem value="VENDIDO">Vendido</SelectItem>
                  <SelectItem value="ELIMINADO">Eliminado</SelectItem>
                  <SelectItem value="RESERVADO">Reservado</SelectItem>
                  <SelectItem value="EN_REVISION">En revisión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adrema">Adrema (opcional)</Label>
            <Input
              id="adrema"
              name="adrema"
              defaultValue={editProperty?.adrema || ""}
              disabled={isLoading}
              placeholder="Código Adrema de la propiedad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rentalPeriod">Período de Renta (opcional)</Label>
            <Select name="rentalPeriod" defaultValue={editProperty?.rentalPeriod || undefined} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MENSUAL">Mensual</SelectItem>
                <SelectItem value="SEMANAL">Semanal</SelectItem>
                <SelectItem value="DIARIO">Diario</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Aplica principalmente para propiedades en alquiler</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubicación</CardTitle>
          <CardDescription>Dirección y localización de la propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Dirección *</Label>
            <Input id="address" name="address" defaultValue={editProperty?.address} required disabled={isLoading} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="countryId">País *</Label>
              <Select
                name="countryId"
                value={selectedCountryId}
                onValueChange={handleCountryChange}
                disabled={isLoading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un país" />
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

            <div className="space-y-2">
              <Label htmlFor="provinceId">Provincia/Estado *</Label>
              <Select
                name="provinceId"
                value={selectedProvinceId}
                onValueChange={handleProvinceChange}
                disabled={isLoading || !selectedCountryId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cityId">Ciudad *</Label>
              <Select
                name="cityId"
                value={selectedCityId}
                onValueChange={handleCityChange}
                disabled={isLoading || !selectedProvinceId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhoodId">Barrio (opcional)</Label>
              <Select
                name="neighborhoodId"
                defaultValue={editProperty?.neighborhoodId || undefined}
                disabled={isLoading || !selectedCityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un barrio" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Código Postal</Label>
            <Input id="zipCode" name="zipCode" defaultValue={editProperty?.zipCode || ""} disabled={isLoading} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={editProperty?.latitude || ""}
                disabled={isLoading}
                onChange={handleCoordinateChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={editProperty?.longitude || ""}
                disabled={isLoading}
                onChange={handleCoordinateChange}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeocodeAddress}
              disabled={isLoading || isGeocoding}
              className="w-full md:w-auto bg-transparent"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando coordenadas...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Calcular Coordenadas desde Dirección
                </>
              )}
            </Button>

            {geocodingMessage && (
              <Alert variant={geocodingMessage.includes("exitosamente") ? "default" : "destructive"}>
                <AlertDescription>{geocodingMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          {mapCoordinates && (
            <div className="space-y-2">
              <Label>Vista Previa del Mapa</Label>
              <PropertiesMap
                properties={[
                  {
                    id: editProperty?.id || "preview",
                    title: editProperty?.title || "Nueva Propiedad",
                    address: editProperty?.address || "Ubicación de la propiedad",
                    latitude: mapCoordinates.lat,
                    longitude: mapCoordinates.lng,
                    price: editProperty?.price || 0,
                    currency: editProperty?.currency || "USD",
                    propertyType: propertyTypes.find((t) => t.id === editProperty?.propertyTypeId)?.name || "Sin tipo",
                    city: cities.find((c) => c.id === editProperty?.cityId)?.name || "Sin ciudad",
                    images: editProperty?.images || [],
                    status: editProperty?.status || "ACTIVO",
                  },
                ]}
                defaultCenter={[mapCoordinates.lat, mapCoordinates.lng]}
                defaultZoom={15}
              />
              <p className="text-xs text-muted-foreground">
                El mapa muestra la ubicación exacta basada en las coordenadas ingresadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características</CardTitle>
          <CardDescription>Detalles físicos de la propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Habitaciones</Label>
              <Input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min="0"
                defaultValue={editProperty?.bedrooms || ""}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min="0"
                defaultValue={editProperty?.bathrooms || ""}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parkingSpaces">Estacionamientos</Label>
              <Input
                id="parkingSpaces"
                name="parkingSpaces"
                type="number"
                min="0"
                defaultValue={editProperty?.parkingSpaces || ""}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearBuilt">Año de Construcción</Label>
              <Input
                id="yearBuilt"
                name="yearBuilt"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                defaultValue={editProperty?.yearBuilt || ""}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area">Área (m²)</Label>
              <Input
                id="area"
                name="area"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editProperty?.area}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotSize">Tamaño del Lote (m²)</Label>
              <Input
                id="lotSize"
                name="lotSize"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editProperty?.lotSize || ""}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Precios</CardTitle>
          <CardDescription>Información de precios y moneda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editProperty?.price}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select name="currency" defaultValue={editProperty?.currency || "USD"} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="DOP">DOP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentalPrice">Precio de Alquiler (opcional)</Label>
              <Input
                id="rentalPrice"
                name="rentalPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editProperty?.rentalPrice || ""}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características Adicionales</CardTitle>
          <CardDescription>Amenidades y características especiales (separadas por comas)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="features">Características</Label>
            <Input
              id="features"
              name="features"
              placeholder="Piscina, Jardín, Terraza, etc."
              defaultValue={editProperty?.features?.join(", ") ?? ""}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenidades</Label>
            <Input
              id="amenities"
              name="amenities"
              placeholder="Gimnasio, Seguridad 24/7, Área de juegos, etc."
              defaultValue={editProperty?.amenities?.join(", ") ?? ""}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multimedia</CardTitle>
          <CardDescription>URLs de imágenes y videos (separadas por comas)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="images">URLs de Imágenes</Label>
            <Textarea
              id="images"
              name="images"
              rows={3}
              placeholder="https://ejemplo.com/imagen1.jpg, https://ejemplo.com/imagen2.jpg"
              defaultValue={editProperty?.images?.join(", ") ?? ""}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videos">URLs de Videos</Label>
            <Input
              id="videos"
              name="videos"
              placeholder="https://youtube.com/watch?v=..."
              defaultValue={editProperty?.videos?.join(", ") ?? ""}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="virtualTour">URL del Tour Virtual</Label>
            <Input
              id="virtualTour"
              name="virtualTour"
              placeholder="https://..."
              defaultValue={editProperty?.virtualTour || ""}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>Opciones de visualización y sincronización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyLabel">Etiqueta de Propiedad</Label>
            <Select name="propertyLabel" defaultValue={editProperty?.propertyLabel || "NONE"} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Sin etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin etiqueta</SelectItem>
                <SelectItem value="NUEVA">Nueva</SelectItem>
                <SelectItem value="DESTACADA">Destacada</SelectItem>
                <SelectItem value="REBAJADA">Rebajada</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Selecciona una etiqueta especial para destacar esta propiedad
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="syncToWordPress">Sincronizar con WordPress</Label>
              <p className="text-sm text-muted-foreground">
                Actualizar automáticamente en WordPress al guardar cambios
              </p>
            </div>
            <Switch
              id="syncToWordPress"
              name="syncToWordPress"
              defaultChecked={editProperty?.syncToWordPress ?? true}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="published">Publicada</Label>
              <p className="text-sm text-muted-foreground">Visible en el catálogo público</p>
            </div>
            <Switch
              id="published"
              name="published"
              defaultChecked={editProperty?.published ?? true}
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
          {editProperty ? "Actualizar" : "Crear"} Propiedad
        </Button>
      </div>

      <CreateOwnerDialog open={showCreateOwner} onOpenChange={setShowCreateOwner} onOwnerCreated={handleOwnerCreated} />
    </form>
  )
}
