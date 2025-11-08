"use client"

import { useEffect, useRef, useState } from "react"
import { isValidCoordinate, normalizeCoordinate } from "@/lib/map-utils"

interface PropertyMapProps {
  latitude: number
  longitude: number
  title: string
  address: string
}

export function PropertyMap({ latitude, longitude, title, address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const initTimeout = setTimeout(async () => {
      try {
        console.log("[v0] PropertyMap: Starting initialization...")
        console.log("[v0] PropertyMap: Raw coordinates:", [latitude, longitude])

        let validLat = latitude
        let validLng = longitude

        if (!isValidCoordinate(latitude, longitude)) {
          console.warn("[v0] PropertyMap: Invalid coordinates detected, attempting to fix...")
          const normalized = normalizeCoordinate(latitude, longitude)

          if (!normalized) {
            setError("Coordenadas inválidas para esta propiedad")
            setIsLoading(false)
            return
          }

          validLat = normalized.lat
          validLng = normalized.lng
          console.log("[v0] PropertyMap: Using normalized coordinates:", [validLat, validLng])
        }

        const L = await import("leaflet")
        console.log("[v0] PropertyMap: Leaflet imported")

        if (!mapRef.current) {
          console.error("[v0] PropertyMap: Container not found")
          setError("Map container not found")
          return
        }

        const { offsetHeight, offsetWidth } = mapRef.current
        console.log("[v0] PropertyMap: Container size:", { width: offsetWidth, height: offsetHeight })

        if (offsetHeight === 0 || offsetWidth === 0) {
          console.error("[v0] PropertyMap: Container has no dimensions")
          setError("Container has no dimensions")
          return
        }

        console.log("[v0] PropertyMap: Creating map at", [validLat, validLng])
        const map = L.map(mapRef.current, {
          center: [validLat, validLng],
          zoom: 15,
          scrollWheelZoom: true,
          zoomControl: true,
          preferCanvas: false,
        })

        mapInstanceRef.current = map
        console.log("[v0] PropertyMap: Map created")

        console.log("[v0] PropertyMap: Adding tile layer...")
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 1,
        }).addTo(map)

        console.log("[v0] PropertyMap: Tile layer added")

        console.log("[v0] PropertyMap: Adding marker...")
        const marker = L.marker([validLat, validLng]).addTo(map)
        marker.bindPopup(`<strong>${title}</strong><br>${address}`)
        console.log("[v0] PropertyMap: Marker added")

        setTimeout(() => {
          map.invalidateSize()
          console.log("[v0] PropertyMap: Size invalidated")
          setIsLoading(false)
        }, 300)

        console.log("[v0] PropertyMap: Initialization complete")
      } catch (err) {
        console.error("[v0] PropertyMap: Error:", err)
        setError("Error initializing map")
        setIsLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(initTimeout)
      if (mapInstanceRef.current) {
        console.log("[v0] PropertyMap: Cleaning up")
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, title, address])

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-border">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50">
          <div className="text-sm text-muted-foreground">Cargando mapa...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/10">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
