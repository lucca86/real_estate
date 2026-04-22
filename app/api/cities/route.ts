import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const provinceId = searchParams.get("provinceId")

  if (!provinceId) {
    return NextResponse.json({ error: "provinceId is required" }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, province_id")
    .eq("is_active", true)
    .eq("province_id", provinceId)
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
