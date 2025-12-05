import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("role, permission, enabled")
      .order("role")
      .order("permission")

    console.log("[v0] Raw permissions data from DB:", data)
    console.log("[v0] Total records:", data?.length || 0)

    if (error) {
      console.error("Error fetching permissions:", error)
      return NextResponse.json({ error: "Error al cargar permisos" }, { status: 500 })
    }

    // Transform to nested object structure
    const permissions: Record<string, Record<string, boolean>> = {}

    for (const item of data) {
      if (!permissions[item.role]) {
        permissions[item.role] = {}
      }
      permissions[item.role][item.permission] = item.enabled
    }

    console.log("[v0] Transformed permissions:", JSON.stringify(permissions, null, 2))
    console.log("[v0] ADMIN permissions count:", Object.keys(permissions.ADMIN || {}).length)
    console.log("[v0] SUPERVISOR permissions count:", Object.keys(permissions.SUPERVISOR || {}).length)
    console.log("[v0] VENDEDOR permissions count:", Object.keys(permissions.VENDEDOR || {}).length)

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("Error in permissions API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
