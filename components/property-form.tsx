"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, MapPin, Sparkles, Plus } from "lucide-react"
import { createProperty, updateProperty } from "@/lib/actions/properties"
import { geocodeProperty } from "@/lib/geocoding"
import { generatePropertyTitle } from "@/lib/actions/ai-property-title"
import { useToast } from "@/hooks/use-toast"
import { CreateOwnerDialog } from "@/components/create-owner-dialog"
import {
  getCountries,
  getProvinces,
  getCities,
  getNeighborhoods,
  getCitiesByProvince,
  getNeighborhoodsByCity,
} from "@/lib/actions/locations"
import { PropertyImageUpload } from "./property-image-upload"
import { normalizeImages } from "@/lib/image-utils" // Fixed import to use normalizeImages from correct file

// Define a type for image objects
interface PropertyImage {
  id: string
  url: string
  sizes: {
    thumbnail: string
    medium: string
    large: string
  }
  isCover: boolean
  syncToWordPress: boolean
  originalName: string
}

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
  images?: string[] | PropertyImage[] // Updated to allow objects
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
  onSuccess?: () => void // Added onSuccess prop
  agents?: Array<{ id: string; name: string }> // Added agents prop
}

interface PropertyFormData {
  title?: string
  description?: string | null
  ownerId?: string
  propertyTypeId?: string
  status?: string
  address?: string
  cityId?: string | undefined
  countryId?: string | undefined
  state?: string | undefined
  provinceId?: string | undefined
  neighborhoodId?: string | undefined
  latitude?: number | null
  longitude?: number | null
  bedrooms?: number
  bathrooms?: number
  parkingSpaces?: number | null
  area?: number
  yearBuilt?: number | null
  price?: number
  currency?: string | null
  amenities?: string[]
  features?: string[]
  transactionType?: string
  rentalPeriod?: string | null
  zipCode?: string | null
  lotSize?: number | null
  rentalPrice?: number | null
  virtualTour?: string | null
  propertyLabel?: string | null
  syncToWordPress?: boolean
  published?: boolean
  adrema?: string | null
  videos?: string[] // Added videos field
}

export function PropertyForm({ editProperty, onSuccess, agents = [] }: PropertyFormProps) {
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
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string | undefined>(
    editProperty?.neighborhoodId || undefined,
  )
  const [neighborhoodValue, setNeighborhoodValue] = useState<string | undefined>(
    editProperty?.neighborhoodId || undefined,
  )

  const initialImages: PropertyImage[] = editProperty?.images
    ? (normalizeImages(editProperty.images).map((img, index) => ({
        ...img,
        id: img.id || `existing-${index}`,
      })) as PropertyImage[])
    : []

  const [images, setImages] = useState<PropertyImage[]>(initialImages)

  const [addressValue, setAddressValue] = useState<string>(editProperty?.address || "")
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>("")
  const [selectedCityName, setSelectedCityName] = useState<string>("")
  const [selectedNeighborhoodName, setSelectedNeighborhoodName] = useState<string | undefined>(
    editProperty?.neighborhoodId ? neighborhoods.find((n) => n.id === editProperty.neighborhoodId)?.name : undefined,
  )

  const [isSubmitting, setIsSubmitting] = useState(false) // Renamed from isLoading for clarity in form context

  const [featuresInput, setFeaturesInput] = useState<string>(editProperty?.features?.join(", ") || "")
  const [amenitiesInput, setAmenitiesInput] = useState<string>(editProperty?.amenities?.join(", ") || "")

  const [formData, setFormData] = useState<PropertyFormData>({
    title: editProperty?.title,
    description: editProperty?.description,
    ownerId: editProperty?.ownerId,
    propertyTypeId: editProperty?.propertyTypeId,
    status: editProperty?.status || "ACTIVO",
    address: editProperty?.address,
    cityId: editProperty?.cityId || undefined,
    countryId: editProperty?.countryId || undefined,
    state: editProperty?.state || undefined,
    provinceId: editProperty?.provinceId || undefined,
    neighborhoodId: editProperty?.neighborhoodId || undefined,
    latitude: editProperty?.latitude,
    longitude: editProperty?.longitude,
    bedrooms: editProperty?.bedrooms ?? undefined,
    bathrooms: editProperty?.bathrooms ?? undefined,
    parkingSpaces: editProperty?.parkingSpaces,
    area: editProperty?.area,
    yearBuilt: editProperty?.yearBuilt,
    price: editProperty?.price,
    currency: editProperty?.currency,
    // Use temporary states for initial form data
    features: editProperty?.features,
    amenities: editProperty?.amenities,
    transactionType: editProperty?.transactionType || "VENTA",
    rentalPeriod: editProperty?.rentalPeriod,
    zipCode: editProperty?.zipCode,
    lotSize: editProperty?.lotSize,
    rentalPrice: editProperty?.rentalPrice,
    virtualTour: editProperty?.virtualTour,
    propertyLabel: editProperty?.propertyLabel || "NONE",
    syncToWordPress: editProperty?.syncToWordPress ?? true,
    published: editProperty?.published ?? true,
    adrema: editProperty?.adrema,
    videos: editProperty?.videos, // Initialize videos
  })

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
    setIsSubmitting(true)

    const finalFormData = new FormData(event.currentTarget)

    // Append current formData state, ensuring all fields are present
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          finalFormData.append(key, JSON.stringify(value))
        } else {
          finalFormData.append(key, String(value))
        }
      }
    })

    finalFormData.append("images", JSON.stringify(images))

    try {
      let result
      if (editProperty) {
        if (!editProperty.id) {
          throw new Error("ID de propiedad no válido")
        }
        result = await updateProperty(editProperty.id, finalFormData)
        toast({
          title: "Propiedad actualizada",
          description: "La propiedad se ha actualizado exitosamente",
        })
      } else {
        result = await createProperty(finalFormData)
        toast({
          title: "Propiedad creada",
          description: "La propiedad se ha creado exitosamente",
        })
      }
      // Call onSuccess if provided, otherwise navigate
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/properties")
        router.refresh()
      }
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
      setIsSubmitting(false)
    }
  }

  async function handleGeocodeAddress() {
    setGeocodingMessage(null)
    setIsGeocoding(true)

    try {
      const address = formData.address
      const cityName = selectedCityName
      const provinceName = selectedProvinceName
      const neighborhoodName = "" // Optional from Georef, not from select

      console.log("[v0] Geocoding with:", { address, cityName, provinceName, neighborhoodName })

      if (!address || !cityName || !provinceName) {
        setGeocodingMessage("Por favor complete la dirección, ciudad y provincia primero")
        setIsGeocoding(false)
        return
      }

      console.log("[v0] Geocoding address:", address, cityName, provinceName, neighborhoodName)

      const result = await geocodeProperty(address, cityName, provinceName, "Argentina", neighborhoodName)

      if (result) {
        setFormData((prev) => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude,
        }))
        setMapCoordinates({ lat: result.latitude, lng: result.longitude })
        setGeocodingMessage(
          `Coordenadas calculadas exitosamente: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
        )
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
      const propertyTypeId = formData.propertyTypeId
      const propertyTypeName = propertyTypes.find((t) => t.id === propertyTypeId)?.name || ""

      const cityId = formData.cityId
      const provinceId = formData.provinceId
      const cityName = cities.find((c) => c.id === cityId)?.name || ""
      const provinceName = provinces.find((p) => p.id === provinceId)?.name || ""

      const details = {
        propertyType: propertyTypeName,
        transactionType: formData.transactionType as string,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        area: formData.area,
        city: cityName,
        state: provinceName,
        price: formData.price,
        currency: formData.currency as string,
        features: formData.features || [],
        amenities: formData.amenities || [],
      }

      console.log("[v0] Property details for AI:", details)

      const result = await generatePropertyTitle(details)

      console.log("[v0] AI result:", result)

      if (result.success && result.title) {
        setFormData((prev) => ({ ...prev, title: result.title }))
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
    setFormData((prev) => ({ ...prev, ownerId: newOwner.id }))
    toast({
      title: "Propietario creado",
      description: `${newOwner.name} ha sido agregado exitosamente`,
    })
  }

  async function handleCountryChange(countryId: string) {
    setSelectedCountryId(countryId)
    setSelectedProvinceId(undefined)
    setSelectedProvinceName("") // Clear province name
    setSelectedCityId(undefined)
    setSelectedCityName("") // Clear city name
    setProvinces([])
    setCities([])
    setNeighborhoods([])
    setFormData((prev) => ({ ...prev, countryId, provinceId: undefined, cityId: undefined, neighborhoodId: undefined }))

    if (countryId) {
      setIsLoading(true)
      try {
        const countryProvinces = await getProvinces(countryId)
        setProvinces(countryProvinces)
      } catch (error) {
        console.error("[v0] Error loading provinces:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleProvinceChange = async (provinceId: string) => {
    setFormData((prev) => ({
      ...prev,
      provinceId,
      cityId: "",
      neighborhoodId: "",
    }))

    const province = provinces.find((p) => p.id === provinceId)
    setSelectedProvinceName(province?.name || "")
    setSelectedProvinceId(provinceId || undefined) // Update selectedProvinceId

    if (provinceId) {
      const provinceCities = await getCitiesByProvince(provinceId)
      setCities(provinceCities)
    } else {
      setCities([])
    }
    setNeighborhoods([])
  }

  const handleCityChange = async (cityId: string) => {
    setFormData((prev) => ({
      ...prev,
      cityId,
      neighborhoodId: "",
    }))

    const city = cities.find((c) => c.id === cityId)
    setSelectedCityName(city?.name || "")
    setSelectedCityId(cityId || undefined) // Update selectedCityId

    if (cityId) {
      const cityNeighborhoods = await getNeighborhoodsByCity(cityId)
      setNeighborhoods(cityNeighborhoods)
    } else {
      setNeighborhoods([])
    }
  }

  async function handleNeighborhoodChange(neighborhoodId: string) {
    setSelectedNeighborhoodId(neighborhoodId)
    setFormData((prev) => ({ ...prev, neighborhoodId }))

    const selectedNeighborhood = neighborhoods.find((n) => n.id === neighborhoodId)
    if (selectedNeighborhood) {
      setSelectedNeighborhoodName(selectedNeighborhood.name)
      console.log("[v0] Neighborhood changed to:", selectedNeighborhood.name)
    }
  }

  function handleCoordinateChange() {
    const latitudeInput = document.getElementById("latitude") as HTMLInputElement
    const longitudeInput = document.getElementById("longitude") as HTMLInputElement

    const lat = latitudeInput?.value ? Number.parseFloat(latitudeInput.value) : null
    const lng = longitudeInput?.value ? Number.parseFloat(longitudeInput.value) : null

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      setMapCoordinates({ lat, lng })
      setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
    } else {
      setMapCoordinates(null)
      setFormData((prev) => ({ ...prev, latitude: null, longitude: null }))
    }
  }

  function handleMarkerDrag(lat: number, lng: number) {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
    setMapCoordinates({ lat, lng })
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
                value={formData.title || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                required
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateTitle}
                disabled={isSubmitting || isGeneratingTitle}
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
              value={formData.description ?? ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerId">Propietario *</Label>
            <div className="flex gap-2">
              <Select
                name="ownerId"
                defaultValue={formData.ownerId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, ownerId: value }))}
                disabled={isSubmitting}
                required
              >
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
                disabled={isSubmitting}
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
                value={formData.propertyTypeId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, propertyTypeId: value }))}
                disabled={isSubmitting}
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
                value={formData.transactionType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, transactionType: value }))}
                disabled={isSubmitting}
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
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                disabled={isSubmitting}
              >
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
              value={formData.adrema || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, adrema: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Código Adrema de la propiedad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rentalPeriod">Período de Renta (opcional)</Label>
            <Select
              name="rentalPeriod"
              value={formData.rentalPeriod || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, rentalPeriod: value }))}
              disabled={isSubmitting}
            >
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="countryId">País *</Label>
              <Select
                name="countryId"
                value={selectedCountryId}
                onValueChange={handleCountryChange}
                disabled={isSubmitting}
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
              <Label htmlFor="provinceId">Provincia</Label>
              <Select
                name="provinceId"
                value={formData.provinceId || ""}
                onValueChange={handleProvinceChange}
                disabled={isSubmitting || !selectedCountryId}
              >
                <SelectTrigger id="provinceId">
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
              <Label htmlFor="cityId">Ciudad</Label>
              <Select
                name="cityId"
                value={formData.cityId || ""}
                onValueChange={handleCityChange}
                disabled={!formData.provinceId || isSubmitting}
              >
                <SelectTrigger id="cityId">
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
                value={formData.neighborhoodId || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, neighborhoodId: value }))}
                disabled={!formData.cityId || isSubmitting}
              >
                <SelectTrigger id="neighborhoodId">
                  <SelectValue placeholder="Seleccione un barrio" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.length === 0 && formData.cityId && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay barrios registrados para esta ciudad
                    </div>
                  )}
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {neighborhoods.length === 0 && formData.cityId && (
                <p className="text-xs text-muted-foreground">Puede dejar este campo vacío si no encuentra el barrio</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Dirección (Calle y Altura) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Ej: Av. Corrientes 1234"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Escriba la dirección completa con calle y número</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Código Postal</Label>
            <p className="text-sm text-muted-foreground">
              Ingrese el código postal manualmente (La API de Georef no proporciona códigos postales)
            </p>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
              disabled={isSubmitting}
              placeholder="Ej: C1043"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitud</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitud</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeocodeAddress}
              disabled={isSubmitting || isGeocoding || !formData.address || !selectedProvinceName || !selectedCityName}
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
              {/* <PropertiesMap
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
                    images: editProperty?.images
                      ? Array.isArray(editProperty.images)
                        ? editProperty.images.map((img) => (typeof img === "string" ? img : img.url))
                        : []
                      : [], // Handle string or object array for images
                    status: editProperty?.status || "ACTIVO",
                  },
                ]}
                defaultCenter={[mapCoordinates.lat, mapCoordinates.lng]}
                defaultZoom={15}
                draggable={true}
                onMarkerDrag={handleMarkerDrag}
              /> */}
              <p className="text-xs text-muted-foreground">
                Haga click en el marcador para ver la dirección. Puede arrastrar el marcador para ajustar la ubicación
                manualmente.
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
                value={formData.bedrooms ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: Number(e.target.value) }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Baños</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min="0"
                value={formData.bathrooms ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: Number(e.target.value) }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parkingSpaces">Estacionamientos</Label>
              <Input
                id="parkingSpaces"
                name="parkingSpaces"
                type="number"
                min="0"
                value={formData.parkingSpaces ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, parkingSpaces: Number(e.target.value) }))}
                disabled={isSubmitting}
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
                value={formData.yearBuilt ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, yearBuilt: Number(e.target.value) }))}
                disabled={isSubmitting}
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
                value={formData.area ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, area: Number(e.target.value) }))}
                required
                disabled={isSubmitting}
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
                value={formData.lotSize ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, lotSize: Number(e.target.value) }))}
                disabled={isSubmitting}
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
                value={formData.price ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select
                name="currency"
                value={formData.currency || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DOP">Pesos</SelectItem>
                  <SelectItem value="USD">Dólares</SelectItem>
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
                value={formData.rentalPrice ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, rentalPrice: Number(e.target.value) }))}
                disabled={isSubmitting}
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
            {/* <Input
              id="features"
              name="features"
              placeholder="Piscina, Jardín, Terraza, Cancha de tenis, etc."
              value={formData.features?.join(", ") ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  features: e.target.value,
                }))
              }
              onBlur={(e) => {
                const processed = e.target.value
                  .split(",")
                  .map((f) => f.trim())
                  .filter(Boolean)
                setFormData((prev) => ({
                  ...prev,
                  features: processed,
                }))
              }}
              disabled={isSubmitting}
            /> */}
            <Input
              placeholder="Ej: Jardín, Piscina, etc."
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              onBlur={(e) => {
                const value = e.target.value
                const featuresArray = value
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
                setFormData((prev) => ({ ...prev, features: featuresArray }))
              }}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Escribe las características separadas por comas. Ej: Piscina, Jardín, Terraza
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenidades</Label>
            {/* <Input
              id="amenities"
              name="amenities"
              placeholder="Gimnasio, Seguridad 24/7, Área de juegos, Mesa de ping pong, etc."
              value={formData.amenities?.join(", ") ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amenities: e.target.value,
                }))
              }
              onBlur={(e) => {
                const processed = e.target.value
                  .split(",")
                  .map((a) => a.trim())
                  .filter(Boolean)
                setFormData((prev) => ({
                  ...prev,
                  amenities: processed,
                }))
              }}
              disabled={isSubmitting}
            /> */}
            <Textarea
              placeholder="Ej: Gimnasio, Seguridad 24/7, Área de juegos, etc."
              value={amenitiesInput}
              onChange={(e) => setAmenitiesInput(e.target.value)}
              onBlur={(e) => {
                const value = e.target.value
                const amenitiesArray = value
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
                setFormData((prev) => ({ ...prev, amenities: amenitiesArray }))
              }}
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Escribe las amenidades separadas por comas. Ej: Gimnasio, Seguridad 24/7, Área de juegos
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multimedia</CardTitle>
          <CardDescription>URLs de imágenes y videos (separadas por comas)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="videos">URLs de Videos</Label>
            <Input
              id="videos"
              name="videos"
              placeholder="https://youtube.com/watch?v=..."
              value={formData.videos?.join(", ") ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  videos: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                }))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="virtualTour">URL del Tour Virtual</Label>
            <Input
              id="virtualTour"
              name="virtualTour"
              placeholder="https://..."
              value={formData.virtualTour || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, virtualTour: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imágenes de la Propiedad</CardTitle>
          <CardDescription>Sube hasta {12} imágenes optimizadas automáticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyImageUpload images={images} onChange={setImages} maxImages={12} />
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
            <Select
              name="propertyLabel"
              value={formData.propertyLabel || ""}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, propertyLabel: value }))}
              disabled={isSubmitting}
            >
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
              checked={formData.syncToWordPress ?? true}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, syncToWordPress: checked }))}
              disabled={isSubmitting}
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
              checked={formData.published ?? true}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, published: checked }))}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editProperty ? "Actualizar" : "Crear"} Propiedad
        </Button>
      </div>

      <CreateOwnerDialog open={showCreateOwner} onOpenChange={setShowCreateOwner} onOwnerCreated={handleOwnerCreated} />
    </form>
  )
}
