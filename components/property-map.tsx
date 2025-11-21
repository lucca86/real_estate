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
  draggable?: boolean
  onMarkerDrag?: (lat: number, lng: number) => void
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

          marker.bindPopup(`
            <div class="text-sm">
              <strong>${property.address}</strong><br/>
              ${property.city}<br/>
              <span class="text-xs text-muted-foreground">
                ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </span>
            </div>
          `)

          marker.on("click", () => {
            setSelectedProperty(property)
            map.setView([lat, lng], 16, { animate: true })
            marker.openPopup()
          })

          if (draggable && onMarkerDrag) {
            marker.on("dragend", (event) => {
              const newPos = event.target.getLatLng()
              onMarkerDrag(newPos.lat, newPos.lng)

              marker.setPopupContent(`
                <div class="text-sm">
                  <strong>${property.address}</strong><br/>
                  ${property.city}<br/>
                  <span class="text-xs text-muted-foreground">
                    ${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}
                  </span>
                  <br/>
                  <span class="text-xs text-green-600">✓ Ubicación actualizada</span>
                </div>
              `)
              marker.openPopup()
            })
          }

          marker.addTo(map)
          markersRef.current.push(marker)
        })

        setTimeout(() => {
          if (mapInstanceRef.current && mapRef.current) {
            try {
              mapInstanceRef.current.invalidateSize()
            } catch (err) {
              console.error("[v0] Error invalidating map size:", err)
            }
          }
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

export { PropertiesMap as PropertyMap }
