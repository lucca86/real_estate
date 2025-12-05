import { NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { getAuditLogs } from "@/lib/audit"

export async function GET(request: Request) {
  const user = await getCurrentUser()

  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const module = searchParams.get("module") || undefined
  const action = searchParams.get("action") || undefined
  const user_id = searchParams.get("user_id") || undefined
  const start_date = searchParams.get("start_date") || undefined
  const end_date = searchParams.get("end_date") || undefined
  const search = searchParams.get("search") || undefined
  const limit = Number.parseInt(searchParams.get("limit") || "100")
  const offset = Number.parseInt(searchParams.get("offset") || "0")

  const { data, count, error } = await getAuditLogs(
    {
      module: module as any,
      action: action as any,
      user_id,
      start_date,
      end_date,
      search,
    },
    limit,
    offset,
  )

  if (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }

  return NextResponse.json({ logs: data, count })
}
