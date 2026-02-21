"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import { PropertiesMap } from "@/components/property-map" // Import PropertiesMap
import { PropertyFeaturesSelector } from "@/components/property-features-selector"
import {
  getPropertyFeatures,
  assignFeaturesToProperty,
  getPropertyFeatureAssignments,
} from "@/lib/actions/property-features"

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
  lotSize?: number | null
  frontSize?: number | null // Added frontSize
  depthSize?: number | null // Added depthSize
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
  rentalPrice?: number | null
  virtualTour?: string | null
  propertyLabel?: string | null
  published?: boolean
  features?: string[]
  videos?: string[]
  internalNotes?: string | null
  createdAt?: Date
  updatedAt?: Date
  // Added properties from the update section
  category?: string
  type?: string
  lotArea?: number
  garages?: number
  floors?: number
  constructionYear?: number
  orientation?: string
  frontMeters?: number
  backMeters?: number
  mainImage?: string
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
  createdBy?: string
}

interface PropertyFormProps {
  editProperty?: Property
  onSuccess?: () => void // Added onSuccess prop
  agents?: Array<{ id: string; name: string }> // Added agents prop
  userId?: string // Added userId prop
  owners?: Array<{ id: string; name: string }> // Added owners prop
  cities?: Array<{ id: string; name: string }> // Added cities prop
  propertyTypes?: Array<{ id: string; name: string }> // Added propertyTypes prop
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
  area?: number | undefined // Changed to undefined to allow empty values
  lotSize?: number | undefined // Changed to undefined
  frontSize?: number | undefined // Added frontSize
  depthSize?: number | undefined // Added depthSize
  yearBuilt?: number | null
  price?: number | undefined // Changed to undefined
  currency?: string | null
  amenities?: string[]
  features?: string[]
  transactionType?: string
  rentalPeriod?: string | null
  zipCode?: string | null
  rentalPrice?: number | undefined // Changed to undefined
  virtualTour?: string | null
  propertyLabel?: string | null
  syncToWordPress?: boolean
  published?: boolean
  adrema?: string | null
  videos?: string[] // Added videos field
  internalNotes?: string | null
  // Added properties from the update section
  category?: string
  type?: string
  lotArea?: number | undefined
  garages?: number | undefined
  floors?: number | undefined
  constructionYear?: number | null
  orientation?: string | undefined
  frontMeters?: number | undefined
  backMeters?: number | undefined
  mainImage?: string | undefined
  ownerName?: string | undefined
  ownerEmail?: string | undefined
  ownerPhone?: string | undefined
  createdBy?: string | undefined
}

export function PropertyForm({
  editProperty,
  onSuccess,
  agents = [],
  userId,
  owners = [],
  cities = [],
  propertyTypes = [],
}: PropertyFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geocodingMessage, setGeocodingMessage] = useState<string | null>(null)
  const [propertyOwners, setPropertyOwners] = useState<Array<{ id: string; name: string }>>(owners) // Renamed to avoid conflict
  const [propertyTypesList, setPropertyTypesList] = useState<Array<{ id: string; name: string }>>(propertyTypes) // Renamed to avoid conflict
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(
    editProperty?.latitude && editProperty?.longitude
      ? { lat: editProperty.latitude, lng: editProperty.longitude }
      : null,
  )
  const { toast } = useToast()
  const [showCreateOwner, setShowCreateOwner] = useState(false)

  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([])
  const [provinces, setProvinces] = useState<Array<{ id: string; name: string }>>([])
  const [propertyCities, setCities] = useState<Array<{ id: string; name: string }>>(cities) // Renamed to avoid conflict
  const [neighborhoods, setNeighborhoods] = useState<Array<{ id: string; name: string }>>([])

  const [selectedCountryId, setSelectedCountryId] = useState<string | undefined>(
    editProperty?.countryId || "clyqxm3uy0000svxl6d4vgxwz",
  )
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | undefined>(
    editProperty?.provinceId || "73d2a02b-a005-4c08-8df8-a7e57ec3f63e",
  )
  const [selectedCityId, setSelectedCityId] = useState<string | undefined>(
    editProperty?.cityId || "18377e89-ca6e-4e27-ab35-6892af66143b",
  )
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

  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false) // Renamed from isLoading for clarity in form context

  const [selectedCaracteristicas, setSelectedCaracteristicas] = useState<string[]>([])
  const [selectedAmenidades, setSelectedAmenidades] = useState<string[]>([])
  const [caracteristicasOptions, setCaracteristicasOptions] = useState<any[]>([])
  const [amenidadesOptions, setAmenidadesOptions] = useState<any[]>([])

  const parseArrayField = (field: any): string[] => {
    if (!field) return []

    // If it's already an array
    if (Array.isArray(field)) {
      const cleanedArray = field
        .map((item) => {
          if (typeof item === "string") {
            // Clean escaped JSON strings like ["\"item\""]
            const cleaned = item.replace(/^[["\s]+|[\]"\s]+$/g, "").replace(/\\/g, "")
            return cleaned || null
          }
          return item
        })
        .filter(Boolean)

      return cleanedArray
    }

    // If it's a string
    if (typeof field === "string") {
      try {
        const parsed = JSON.parse(field)
        if (Array.isArray(parsed)) {
          // Recursively clean the parsed array
          return parseArrayField(parsed)
        }
      } catch {
        // Not JSON, try comma-separated
        return field
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      }
    }

    return []
  }

  const [featuresInput, setFeaturesInput] = useState<string>(parseArrayField(editProperty?.features).join(", "))
  const [amenitiesInput, setAmenitiesInput] = useState<string>(parseArrayField(editProperty?.amenities).join(", "))

  const [formData, setFormData] = useState<PropertyFormData>({
    title: editProperty?.title || "",
    description: editProperty?.description || "",
    ownerId: editProperty?.ownerId,
    propertyTypeId: editProperty?.propertyTypeId,
    status: editProperty?.status || "ACTIVO",
    address: editProperty?.address || "",
    cityId: editProperty?.cityId || "18377e89-ca6e-4e27-ab35-6892af66143b",
    countryId: editProperty?.countryId || "clyqxm3uy0000svxl6d4vgxwz",
    state: editProperty?.state || undefined,
    provinceId: editProperty?.provinceId || "73d2a02b-a005-4c08-8df8-a7e57ec3f63e",
    neighborhoodId: editProperty?.neighborhoodId || undefined,
    latitude: editProperty?.latitude,
    longitude: editProperty?.longitude,
    bedrooms: editProperty?.bedrooms ?? undefined,
    bathrooms: editProperty?.bathrooms ?? undefined,
    parkingSpaces: editProperty?.parkingSpaces,
    area: editProperty?.area,
    lotSize: editProperty?.lotSize ?? undefined,
    frontSize: editProperty?.frontSize ?? undefined, // Keep frontSize for existing data
    depthSize: editProperty?.depthSize ?? undefined, // Keep depthSize for existing data
    yearBuilt: editProperty?.yearBuilt,
    price: editProperty?.price,
    currency: editProperty?.currency || "USD",
    // Use temporary states for initial form data
    features: editProperty?.features,
    amenities: editProperty?.amenities,
    transactionType: editProperty?.transactionType || "VENTA",
    rentalPeriod: editProperty?.rentalPeriod,
    zipCode: editProperty?.zipCode,
    rentalPrice: editProperty?.rentalPrice ?? undefined,
    virtualTour: editProperty?.virtualTour,
    propertyLabel: editProperty?.propertyLabel || "NONE",
    syncToWordPress: (editProperty as any)?.sync_to_wordpress ?? true,
    published: editProperty?.published ?? true,
    adrema: editProperty?.adrema,
    videos: editProperty?.videos, // Initialize videos
    internalNotes: editProperty?.internalNotes || null,
    // Properties from the update section
    category: editProperty?.category || "",
    type: editProperty?.type || "Venta",
    lotArea: editProperty?.lotArea ?? undefined,
    garages: editProperty?.garages ?? undefined,
    floors: editProperty?.floors ?? undefined,
    constructionYear: editProperty?.constructionYear,
    orientation: editProperty?.orientation,
    frontMeters: editProperty?.frontMeters ?? editProperty?.frontSize ?? undefined,
    backMeters: editProperty?.backMeters ?? editProperty?.depthSize ?? undefined,
    mainImage: editProperty?.mainImage,
    ownerName: editProperty?.ownerName,
    ownerEmail: editProperty?.ownerEmail,
    ownerPhone: editProperty?.ownerPhone,
    createdBy: editProperty?.createdBy || userId || "",
  })

  const scrollRef = useRef<HTMLFormElement>(null)

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
    const loadFeatures = async () => {
      try {
        const [caracteristicas, amenidades] = await Promise.all([
          getPropertyFeatures("CARACTERISTICA"),
          getPropertyFeatures("AMENIDAD"),
        ])

        setCaracteristicasOptions(caracteristicas)
        setAmenidadesOptions(amenidades)

        // Load existing assignments if editing
        if (editProperty?.id) {
          const assignments = await getPropertyFeatureAssignments(editProperty.id)
          const caracIds = assignments
            .filter((a: any) => a.property_features?.type === "CARACTERISTICA")
            .map((a: any) => a.feature_id)
          const amenIds = assignments
            .filter((a: any) => a.property_features?.type === "AMENIDAD")
            .map((a: any) => a.feature_id)

          setSelectedCaracteristicas(caracIds)
          setSelectedAmenidades(amenIds)
        }
      } catch (error) {
        console.error("[v0] Error loading features:", error)
      }
    }

    loadFeatures()
  }, [editProperty?.id])

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
          setPropertyOwners(ownersData) // Use renamed state
        }

        if (propertyTypesResponse.ok) {
          const propertyTypesData = await propertyTypesResponse.json()
          setPropertyTypesList(propertyTypesData) // Use renamed state
        }

        setCountries(countriesData)

        // Fetch provinces, cities, and neighborhoods based on default or existing IDs
        if (selectedCountryId) {
          const provincesData = await getProvinces(selectedCountryId)
          setProvinces(provincesData)
        }
        if (selectedProvinceId) {
          const citiesData = await getCities(selectedProvinceId)
          setCities(citiesData) // Use renamed state
        }
        if (selectedCityId) {
          const neighborhoodsData = await getNeighborhoods(selectedCityId)
          setNeighborhoods(neighborhoodsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [selectedCountryId, selectedProvinceId, selectedCityId])

  useEffect(() => {
    if (provinces.length > 0 && selectedProvinceId && !selectedProvinceName) {
      const province = provinces.find((p) => p.id === selectedProvinceId)
      if (province) {
        setSelectedProvinceName(province.name)
      }
    }
  }, [provinces, selectedProvinceId, selectedProvinceName])

  useEffect(() => {
    if (propertyCities.length > 0 && selectedCityId && !selectedCityName) {
      // Use renamed state
      const city = propertyCities.find((c) => c.id === selectedCityId)
      if (city) {
        setSelectedCityName(city.name)
      }
    }
  }, [propertyCities, selectedCityId, selectedCityName])

  useEffect(() => {
    if (neighborhoods.length > 0 && formData.neighborhoodId && !selectedNeighborhoodName) {
      const neighborhood = neighborhoods.find((n) => n.id === formData.neighborhoodId)
      if (neighborhood) {
        setSelectedNeighborhoodName(neighborhood.name)
      }
    }
  }, [neighborhoods, formData.neighborhoodId, selectedNeighborhoodName])

  // Auto-calculate lot size when front and back meters change
  useEffect(() => {
    if (formData.frontMeters && formData.backMeters && formData.frontMeters > 0 && formData.backMeters > 0) {
      const calculated = Number((formData.frontMeters * formData.backMeters).toFixed(2))
      
      // Only auto-update if lotSize is empty, zero, or matches previous calculation
      // This allows manual override while still auto-calculating for new entries
      if (!formData.lotSize || formData.lotSize === 0) {
        setFormData((prev) => ({ ...prev, lotSize: calculated }))
      }
    }
  }, [formData.frontMeters, formData.backMeters])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmittingRef.current) {
      console.log("[v0] Form already submitting, ignoring duplicate submission")
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const validationErrors: string[] = []

    if (!formData.title?.trim()) validationErrors.push("El título es requerido")
    if (!formData.description?.trim()) validationErrors.push("La descripción es requerida")
    if (!formData.ownerId) validationErrors.push("Debe seleccionar un propietario")
    if (!formData.propertyTypeId) validationErrors.push("Debe seleccionar un tipo de propiedad")
    if (!formData.status) validationErrors.push("Debe seleccionar un estado")
    if (!formData.cityId) validationErrors.push("Debe seleccionar una ciudad")
    if (!formData.provinceId) validationErrors.push("Debe seleccionar una provincia")
    if (!formData.countryId) validationErrors.push("Debe seleccionar un país")
    if (!formData.address?.trim()) validationErrors.push("La dirección es requerida")
    if (formData.price === undefined || formData.price === null) {
      validationErrors.push("El precio es requerido")
    }
    if (!formData.currency) validationErrors.push("Debe seleccionar una moneda")

    const selectedPropertyType = propertyTypesList.find((pt) => pt.id === formData.propertyTypeId) // Use renamed state
    const isLand = selectedPropertyType?.name?.toLowerCase().includes("terreno")

    // Only validate yearBuilt if it's not a land property
    if (!isLand && formData.yearBuilt !== undefined && formData.yearBuilt !== null && formData.yearBuilt < 1800) {
      validationErrors.push("El año de construcción debe ser mayor a 1800 o dejarlo vacío")
    }

    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(", ")
      setError(errorMessage)
      toast({
        title: "Errores de validación",
        description: errorMessage,
        variant: "destructive",
      })
      // Resetting submission state
      isSubmittingRef.current = false
      setIsSubmitting(false)
      // Scroll to top to show the error
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (!images || images.length === 0) {
      const errorMessage = "Debes agregar al menos una imagen a la propiedad"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      isSubmittingRef.current = false
      setIsSubmitting(false)
      return
    }

    console.log("[v0] Starting form submission")

    const finalFormData = new FormData()

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === "images" || key === "videos" || key === "amenities" || key === "features") {
          finalFormData.set(key, JSON.stringify(value))
        } else if (typeof value === "boolean") {
          finalFormData.set(key, String(value))
        } else {
          finalFormData.set(key, String(value))
        }
      }
    })

    // Explicitly append images as JSON string as per PropertyImageUpload component's expected format
    if (images.length > 0) {
      finalFormData.append("images", JSON.stringify(images))
    }

    try {
      let result
      let propertyId: string | undefined = undefined // Define propertyId

      if (editProperty) {
        if (!editProperty.id) {
          throw new Error("ID de propiedad no válido")
        }
        result = await updateProperty(editProperty.id, finalFormData)

        if (result && result.warning) {
          toast({
            title: "Propiedad guardada con advertencia",
            description: result.warning,
            variant: "default",
          })
        } else {
          toast({
            title: "Propiedad actualizada",
            description: "La propiedad se actualizó correctamente",
          })
        }
        propertyId = editProperty.id // Set propertyId for updates
      } else {
        result = await createProperty(finalFormData)

        if (!result.success) {
          throw new Error(result.error || "Error al crear la propiedad")
        }

        toast({
          title: "Propiedad creada",
          description: "La propiedad se creó correctamente",
        })
        if (result && typeof result === "object" && "id" in result) {
          // Check if result is an object and has an 'id'
          propertyId = (result as { id: string }).id
        }
      }

      if (propertyId) {
        const allFeatureIds = [...selectedCaracteristicas, ...selectedAmenidades]
        await assignFeaturesToProperty(propertyId, allFeatureIds)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/properties")
        router.refresh()
      }
    } catch (err) {
      console.error("Error submitting form:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al procesar la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  async function handleGeocodeAddress() {
    setGeocodingMessage(null)
    setIsGeocoding(true)

    try {
      const addressInput = document.getElementById("address") as HTMLInputElement
      const address = addressInput?.value || formData.address

      const cityName = selectedCityName
      const provinceName = selectedProvinceName
      const neighborhoodName = selectedNeighborhoodName || ""

      if (!address || !cityName || !provinceName) {
        setGeocodingMessage("Por favor complete la dirección, ciudad y provincia primero")
        setIsGeocoding(false)
        return
      }

      const result = await geocodeProperty(address, cityName, provinceName, "Argentina", neighborhoodName)

      if (result) {
        setFormData((prev) => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude,
        }))

        // Update input fields directly
        const latInput = document.getElementById("latitude") as HTMLInputElement
        const lngInput = document.getElementById("longitude") as HTMLInputElement
        if (latInput) latInput.value = result.latitude.toString()
        if (lngInput) lngInput.value = result.longitude.toString()

        setMapCoordinates({ lat: result.latitude, lng: result.longitude })
        setGeocodingMessage(
          `Coordenadas calculadas exitosamente: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
        )
      } else {
        setGeocodingMessage("No se pudieron calcular las coordenadas. Verifique la dirección e intente nuevamente.")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido"
      setGeocodingMessage(`Error al calcular las coordenadas: ${errorMsg}`)
      console.error("Geocoding error:", err)
    } finally {
      setIsGeocoding(false)
    }
  }

  async function handleGenerateTitle() {
    setIsGeneratingTitle(true)

    try {
      const propertyTypeId = formData.propertyTypeId
      const propertyTypeName = propertyTypesList.find((t) => t.id === propertyTypeId)?.name || "" // Use renamed state

      const cityId = formData.cityId
      const provinceId = formData.provinceId
      const cityName = propertyCities.find((c) => c.id === cityId)?.name || "" // Use renamed state
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

      const result = await generatePropertyTitle(details)

      if (result.success && result.title) {
        setFormData((prev) => ({ ...prev, title: result.title }))
        toast({
          title: "Título generado",
          description: "El título ha sido generado exitosamente con AI",
        })
      } else {
        console.error("AI generation failed:", result.error)
        toast({
          title: "Error",
          description: result.error || "No se pudo generar el título",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error in handleGenerateTitle:", err)
      toast({
        title: "Error",
        description: "Error al generar el título con AI",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  async function handleOwnerCreated(newOwner: { id: string; name: string }) {
    setPropertyOwners((prev) => [...prev, newOwner]) // Use renamed state
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
    setCities([]) // Use renamed state
    setNeighborhoods([])
    setFormData((prev) => ({ ...prev, countryId, provinceId: undefined, cityId: undefined, neighborhoodId: undefined }))

    if (countryId) {
      setIsLoading(true)
      try {
        const countryProvinces = await getProvinces(countryId)
        setProvinces(countryProvinces)
      } catch (error) {
        console.error("Error loading provinces:", error)
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
      setCities(provinceCities) // Use renamed state
    } else {
      setCities([]) // Use renamed state
    }
    setNeighborhoods([])
  }

  const handleCityChange = async (cityId: string) => {
    setFormData((prev) => ({
      ...prev,
      cityId,
      neighborhoodId: "",
    }))

    const city = propertyCities.find((c) => c.id === cityId) // Use renamed state
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
    <form onSubmit={handleSubmit} className="space-y-6" ref={scrollRef}>
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
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="description">
              Descripción <span className="text-destructive">*</span>
            </Label>
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
            <Label htmlFor="ownerId">
              Propietario <span className="text-destructive">*</span>
            </Label>
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
                  {propertyOwners.map(
                    (
                      owner, // Use renamed state
                    ) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setShowCreateOwner(true)
                }}
                disabled={isSubmitting}
                title="Crear nuevo propietario"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {propertyOwners.length === 0 && ( // Use renamed state
              <p className="text-sm text-muted-foreground">
                No hay propietarios disponibles. Haz clic en el botón + para crear uno nuevo.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="propertyTypeId">
                Tipo de Propiedad <span className="text-destructive">*</span>
              </Label>
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
                  {propertyTypesList.map(
                    (
                      type, // Use renamed state
                    ) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {propertyTypesList.length === 0 && ( // Use renamed state
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
              <Label htmlFor="status">
                Estado <span className="text-destructive">*</span>
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                disabled={isSubmitting}
                required
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
              <Label htmlFor="countryId">
                País <span className="text-destructive">*</span>
              </Label>
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
                  {propertyCities.map(
                    (
                      city, // Use renamed state
                    ) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ),
                  )}
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
              <PropertiesMap
                properties={[
                  {
                    id: editProperty?.id || "new",
                    title: formData.title || "Nueva Propiedad",
                    address: formData.address || "Ubicación de la propiedad",
                    latitude: mapCoordinates.lat,
                    longitude: mapCoordinates.lng,
                    price: formData.price || 0,
                    currency: formData.currency || "USD",
                    propertyType: propertyTypesList.find((t) => t.id === formData.propertyTypeId)?.name || "Sin tipo", // Use renamed state
                    city: propertyCities.find((c) => c.id === formData.cityId)?.name || "Sin ciudad", // Use renamed state
                    images: images, // Passing PropertyImage objects directly
                    status: formData.status || "ACTIVO",
                  },
                ]}
                defaultCenter={[mapCoordinates.lat, mapCoordinates.lng]}
                defaultZoom={15}
                draggable={true}
                onMarkerDrag={handleMarkerDrag}
              />
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
                max={new Date().getFullYear()}
                value={formData.yearBuilt ?? ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, yearBuilt: Number(e.target.value) }))}
                disabled={isSubmitting}
                placeholder="Dejar vacío si no aplica"
              />
              <p className="text-xs text-muted-foreground">
                Opcional - Dejar vacío para terrenos o propiedades sin año definido
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="frontMeters">Frente (m)</Label>
              <Input
                id="frontMeters"
                name="frontMeters"
                type="number"
                step="0.01"
                min="0"
                value={formData.frontMeters ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({ ...prev, frontMeters: val === "" ? undefined : Number(val) }))
                }}
                disabled={isSubmitting}
                placeholder="Metros de frente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backMeters">Fondo (m)</Label>
              <Input
                id="backMeters"
                name="backMeters"
                type="number"
                step="0.01"
                min="0"
                value={formData.backMeters ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({ ...prev, backMeters: val === "" ? undefined : Number(val) }))
                }}
                disabled={isSubmitting}
                placeholder="Metros de fondo"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area">Área cubierta (m²)</Label>
              <Input
                id="area"
                name="area"
                type="number"
                step="0.01"
                min="0"
                value={formData.area ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({ ...prev, area: val === "" ? undefined : Number(val) }))
                }}
                disabled={isSubmitting}
                placeholder="Área cubierta"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lotSize" className="text-muted-foreground">
                Tamaño del Lote (m²) <span className="text-xs">(Opcional)</span>
              </Label>
              <Input
                id="lotSize"
                name="lotSize"
                type="number"
                step="0.01"
                min="0"
                value={formData.lotSize ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({ ...prev, lotSize: val === "" ? undefined : Number(val) }))
                }}
                disabled={isSubmitting}
                placeholder="Tamaño del lote"
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
              <Label htmlFor="price">
                Precio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({ ...prev, price: val === "" ? undefined : Number(val) }))
                }}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">
                Moneda <span className="text-destructive">*</span>
              </Label>
              <Select
                name="currency"
                value={formData.currency || "USD"}
                onValueChange={(value) => {
                  setFormData({ ...formData, currency: value })
                }}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">Dólares</SelectItem>
                  <SelectItem value="ARS">Pesos</SelectItem>
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
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => ({ ...prev, rentalPrice: val === "" ? undefined : Number(val) }))
                }}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Características Adicionales</CardTitle>
          <CardDescription>Selecciona las características y amenidades de la propiedad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PropertyFeaturesSelector
            label="Características"
            features={caracteristicasOptions}
            selectedIds={selectedCaracteristicas}
            onChange={setSelectedCaracteristicas}
          />

          <PropertyFeaturesSelector
            label="Amenidades"
            features={amenidadesOptions}
            selectedIds={selectedAmenidades}
            onChange={setSelectedAmenidades}
          />
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

      <Card className="border-l-4 border-l-primary/50">
        <CardHeader>
          <CardTitle>Notas Internas</CardTitle>
          <CardDescription>Información privada visible solo para el equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            value={formData.internalNotes ?? ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, internalNotes: e.target.value || null }))}
            disabled={isSubmitting}
            placeholder="Agregue notas internas sobre esta propiedad que solo sean visibles para el equipo..."
            className="min-h-[120px] resize-y"
          />
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
              disabled={false}
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
              disabled={false}
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
