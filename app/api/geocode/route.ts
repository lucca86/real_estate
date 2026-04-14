import { type NextRequest, NextResponse } from "next/server"
import { geocodeProperty } from "@/lib/geocoding"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const city = searchParams.get("city")
  const state = searchParams.get("state")

  if (!address || !city || !state) {
    return NextResponse.json({ error: "Faltan parámetros: address, city, state" }, { status: 400 })
  }

  try {
    const result = await geocodeProperty(address, city, state)

    if (!result) {
      return NextResponse.json({ error: "No se encontraron coordenadas para esa dirección" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[geocode] Error:", error)
    return NextResponse.json({ error: "Error interno al geocodificar" }, { status: 500 })
  }
}
