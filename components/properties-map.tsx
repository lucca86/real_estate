"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isValidCoordinate, normalizeCoordinate, CORRIENTES_CENTER } from "@/lib/map-utils"

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
  images: string[]
}

interface PropertiesMapProps {
  properties: Property[]
  defaultCenter?: [number, number]
  defaultZoom?: number
}

export function PropertiesMap({ properties, defaultCenter = CORRIENTES_CENTER, defaultZoom = 13 }: PropertiesMapProps) {
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

      // Check if coordinates are valid
      if (isValidCoordinate(p.latitude, p.longitude)) {
        return p
      }

      // Try to normalize invalid coordinates
      const normalized = normalizeCoordinate(p.latitude, p.longitude)
      if (normalized) {
        console.warn(`[v0] PropertiesMap: Normalized coordinates for "${p.title}"`)
        return {
          ...p,
          latitude: normalized.lat,
          longitude: normalized.lng,
        }
      }

      console.error(
        `[v0] PropertiesMap: Skipping property "${p.title}" with invalid coordinates: [${p.latitude}, ${p.longitude}]`,
      )
      return null
    })
    .filter((p): p is Property => p !== null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initTimeout = setTimeout(async () => {
      try {
        console.log("[v0] PropertiesMap: Starting initialization...")
        console.log("[v0] PropertiesMap: Total properties:", properties.length)
        console.log("[v0] PropertiesMap: Valid properties:", validProperties.length)

        if (validProperties.length === 0) {
          console.warn("[v0] PropertiesMap: No properties with valid coordinates")
          setError("No se encontraron propiedades con coordenadas válidas")
          setIsLoading(false)
          return
        }

        validProperties.forEach((p, i) => {
          console.log(`[v0] PropertiesMap: Property ${i + 1}: ${p.title} at [${p.latitude}, ${p.longitude}]`)
        })

        const L = await import("leaflet")
        console.log("[v0] PropertiesMap: Leaflet imported")

        if (!mapRef.current) {
          console.error("[v0] PropertiesMap: Container not found")
          setError("Map container not found")
          return
        }

        const { offsetHeight, offsetWidth } = mapRef.current
        console.log("[v0] PropertiesMap: Container size:", { width: offsetWidth, height: offsetHeight })

        let center: [number, number] = defaultCenter
        const zoom = defaultZoom

        if (validProperties.length > 0) {
          const bounds = L.latLngBounds(validProperties.map((p) => [p.latitude!, p.longitude!]))
          center = [bounds.getCenter().lat, bounds.getCenter().lng]
          console.log("[v0] PropertiesMap: Calculated center:", center)
        } else {
          console.log("[v0] PropertiesMap: Using default center:", center)
        }

        console.log("[v0] PropertiesMap: Creating map...")
        const map = L.map(mapRef.current, {
          center,
          zoom,
          scrollWheelZoom: true,
          zoomControl: true,
          preferCanvas: false,
        })

        mapInstanceRef.current = map
        console.log("[v0] PropertiesMap: Map created")

        console.log("[v0] PropertiesMap: Adding tile layer...")
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
        }).addTo(map)

        console.log("[v0] PropertiesMap: Tile layer added")

        if (validProperties.length > 0) {
          const bounds = L.latLngBounds(validProperties.map((p) => [p.latitude!, p.longitude!]))
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
          console.log("[v0] PropertiesMap: Bounds fitted")
        }

        console.log("[v0] PropertiesMap: Adding markers...")
        validProperties.forEach((property, index) => {
          const lat = property.latitude!
          const lng = property.longitude!

          console.log(`[v0] PropertiesMap: Adding marker ${index + 1}/${validProperties.length}:`, {
            title: property.title,
            coords: [lat, lng],
          })

          const marker = L.marker([lat, lng])

          marker.on("click", () => {
            console.log("[v0] PropertiesMap: Marker clicked:", property.title)
            setSelectedProperty(property)
            map.setView([lat, lng], 16, { animate: true })
          })

          marker.addTo(map)
          markersRef.current.push(marker)

          console.log(`[v0] PropertiesMap: Marker ${index + 1} added successfully`)
        })

        console.log("[v0] PropertiesMap: All markers added. Total:", markersRef.current.length)

        setTimeout(() => {
          map.invalidateSize()
          console.log("[v0] PropertiesMap: Size invalidated")
          setIsLoading(false)
        }, 300)

        console.log("[v0] PropertiesMap: Initialization complete")
      } catch (err) {
        console.error("[v0] PropertiesMap: Error:", err)
        setError("Error initializing map")
        setIsLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(initTimeout)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      if (mapInstanceRef.current) {
        console.log("[v0] PropertiesMap: Cleaning up")
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [properties, validProperties, defaultCenter, defaultZoom])

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
                  src={selectedProperty.images[0] || "/placeholder.svg"}
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
