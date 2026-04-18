import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const supabase = await createAdminClient()
    
    const { data: owners, error } = await supabase
      .from("Owner")
      .select("id, name")
      .eq("isActive", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching owners:", error)
      return NextResponse.json({ error: "Error al obtener propietarios" }, { status: 500 })
    }

    return NextResponse.json(owners)
  } catch (error) {
    console.error("[v0] Error fetching owners:", error)
    return NextResponse.json({ error: "Error al obtener propietarios" }, { status: 500 })
  }
}
