import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const supabase = await createServerClient()
    
    const { data: owners, error } = await supabase
      .from("owners")
      .select("id, name")
      .eq("is_active", true)
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
