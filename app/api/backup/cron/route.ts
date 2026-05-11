import { NextResponse } from "next/server"
import { getBackupSettings, enforceRetention } from "@/lib/actions/backup"

/**
 * GET /api/backup/cron
 *
 * Called daily by Vercel Crons (vercel.json).
 * Vercel automatically passes the CRON_SECRET header when invoking cron jobs.
 * We also check our own BACKUP_CRON_SECRET for extra safety.
 *
 * The cron checks the saved settings before running:
 * - If backup_cron_enabled = false, it skips silently.
 * - It uses the configured defaultScope.
 * - After a successful backup, it enforces the retention policy.
 */
export async function GET(request: Request) {
  // Vercel sends the CRON_SECRET automatically — verify it
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await getBackupSettings()

    if (!settings.cronEnabled) {
      return NextResponse.json({ skipped: true, reason: "Cron disabled in settings" })
    }

    // Trigger the backup via the main route, passing the cron secret
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"

    const res = await fetch(`${baseUrl}/api/backup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-backup-secret": process.env.BACKUP_CRON_SECRET ?? "",
      },
      body: JSON.stringify({ scope: settings.defaultScope, cron: true }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? "Backup failed" }, { status: 500 })
    }

    // Enforce retention after successful backup
    await enforceRetention(settings.retention)

    return NextResponse.json({
      success: true,
      backupId: data.backupId,
      scope: settings.defaultScope,
    })
  } catch (error: any) {
    console.error("[backup/cron] Error:", error)
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 500 })
  }
}
