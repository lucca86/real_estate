import { NextResponse } from "next/server"
import { getActivePropertyTypes } from "@/lib/actions/property-types"

export async function GET() {
  try {
    const propertyTypes = await getActivePropertyTypes()
    return NextResponse.json(propertyTypes)
  } catch (error) {
    console.error("[v0] Error fetching property types:", error)
    return NextResponse.json({ error: "Error al obtener los tipos de propiedad" }, { status: 500 })
  }
}
