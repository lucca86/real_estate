import { NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth"
import { getAuditStats } from "@/lib/audit"

export async function GET() {
  const user = await getCurrentUser()

  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const stats = await getAuditStats()

  return NextResponse.json(stats)
}
