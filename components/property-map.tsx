"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isValidCoordinate, normalizeCoordinate, CORRIENTES_CENTER } from "@/lib/map-utils"
import { normalizeImageUrl } from "@/lib/image-utils"

interface PropertyImage {
  url: string
  sizes?: {
    thumbnail?: string
    medium?: string
    large?: string
    full?: string
  }
  isCover?: boolean
  syncToWordPress?: boolean
}

interface Property {
  id: string
  title: string
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  price: number
  currency: string
  propertyType: string
  status: string
  images: (string | PropertyImage)[]
}

interface PropertiesMapProps {
  properties: Property[]
  defaultCenter?: [number, number]
  defaultZoom?: number
  draggable?: boolean
  onMarkerDrag?: (lat: number, lng: number) => void
}

// Single property map component
interface PropertyMapProps {
  latitude: number | null
  longitude: number | null
  title?: string
  address?: string
  draggable?: boolean
  onMarkerDrag?: (lat: number, lng: number) => void
}

export function PropertyMap({
  latitude,
  longitude,
  title,
  address,
  draggable = false,
  onMarkerDrag,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initTimeout = setTimeout(async () => {
      try {
        if (!latitude || !longitude || !isValidCoordinate(latitude, longitude)) {
          setError("Coordenadas inválidas o no disponibles")
          setIsLoading(false)
          return
        }

        const L = await import("leaflet")

        if (!mapRef.current) {
          setError("Map container not found")
          return
        }

        const map = L.map(mapRef.current, {
          center: [latitude, longitude],
          zoom: 15,
          scrollWheelZoom: true,
          zoomControl: true,
          preferCanvas: false,
        })

        mapInstanceRef.current = map

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
        }).addTo(map)

        const marker = L.marker([latitude, longitude], {
          draggable: draggable,
        })

        if (title) {
          marker.bindPopup(title)
        }

        if (draggable && onMarkerDrag) {
          marker.on("dragend", () => {
            const position = marker.getLatLng()
            onMarkerDrag(position.lat, position.lng)
          })
        }

        marker.addTo(map)
        markerRef.current = marker

        setTimeout(() => {
          map.invalidateSize()
          setIsLoading(false)
        }, 300)
      } catch (err) {
        setError("Error initializing map")
        setIsLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(initTimeout)
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, title, draggable, onMarkerDrag])

  return (
    <div className="relative h-[400px] w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">Cargando mapa...</div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-destructive/10 px-4 py-2">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full rounded-lg border border-border" />
    </div>
  )
}

export function PropertiesMap({
  properties,
  defaultCenter = CORRIENTES_CENTER,
  defaultZoom = 13,
  draggable = false,
  onMarkerDrag,
}: PropertiesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const validProperties = properties
    .map((p) => {
      if (!p.latitude || !p.longitude) return null

      if (isValidCoordinate(p.latitude, p.longitude)) {
        return p
      }

      const normalized = normalizeCoordinate(p.latitude, p.longitude)
      if (normalized) {
        return {
          ...p,
          latitude: normalized.lat,
          longitude: normalized.lng,
        }
      }

      return null
    })
    .filter((p): p is Property => p !== null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initTimeout = setTimeout(async () => {
      try {
        if (validProperties.length === 0) {
          setError("No se encontraron propiedades con coordenadas válidas")
          setIsLoading(false)
          return
        }

        const L = await import("leaflet")

        if (!mapRef.current) {
          setError("Map container not found")
          return
        }

        let center: [number, number] = defaultCenter
        const zoom = defaultZoom

        if (validProperties.length > 0) {
          const bounds = L.latLngBounds(validProperties.map((p) => [p.latitude!, p.longitude!]))
          center = [bounds.getCenter().lat, bounds.getCenter().lng]
        }

        const map = L.map(mapRef.current, {
          center,
          zoom,
          scrollWheelZoom: true,
          zoomControl: true,
          preferCanvas: false,
        })

        mapInstanceRef.current = map

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
        }).addTo(map)

        if (validProperties.length > 0) {
          const bounds = L.latLngBounds(validProperties.map((p) => [p.latitude!, p.longitude!]))
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        }

        validProperties.forEach((property) => {
          const lat = property.latitude!
          const lng = property.longitude!

          const marker = L.marker([lat, lng], {
            draggable: draggable,
          })

          marker.on("click", () => {
            setSelectedProperty(property)
            map.setView([lat, lng], 16, { animate: true })
          })

          if (draggable && onMarkerDrag) {
            marker.on("dragend", () => {
              const position = marker.getLatLng()
              onMarkerDrag(position.lat, position.lng)
            })
          }

          marker.addTo(map)
          markersRef.current.push(marker)
        })

        setTimeout(() => {
          map.invalidateSize()
          setIsLoading(false)
        }, 300)
      } catch (err) {
        setError("Error initializing map")
        setIsLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(initTimeout)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [properties, validProperties, defaultCenter, defaultZoom, draggable, onMarkerDrag])

  const typeLabels: Record<string, string> = {
    CASA: "Casa",
    APARTAMENTO: "Apartamento",
    TERRENO: "Terreno",
    LOCAL_COMERCIAL: "Local Comercial",
    OFICINA: "Oficina",
    BODEGA: "Bodega",
  }

  const statusLabels: Record<string, string> = {
    DISPONIBLE: "Disponible",
    RESERVADO: "Reservado",
    VENDIDO: "Vendido",
    ALQUILADO: "Alquilado",
  }

  return (
    <div className="relative h-[600px] w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">Cargando mapa...</div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-destructive/10 px-4 py-2">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full rounded-lg border border-border" />

      {selectedProperty && (
        <Card className="absolute bottom-4 left-4 right-4 z-1000 max-w-md shadow-lg md:left-auto">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {selectedProperty.images[0] && (
                <img
                  src={normalizeImageUrl(selectedProperty.images[0]) || "/placeholder.svg"}
                  alt={selectedProperty.title}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-balance line-clamp-2">{selectedProperty.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{selectedProperty.address}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{typeLabels[selectedProperty.propertyType]}</Badge>
                  <Badge variant="outline">{statusLabels[selectedProperty.status]}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${selectedProperty.price.toLocaleString()} {selectedProperty.currency}
                  </span>
                  <button
                    onClick={() => router.push(`/catalog/${selectedProperty.id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
