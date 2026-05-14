import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import JSZip from "jszip"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

// Tables to include in DB backup (all public tables)
const DB_TABLES = [
  "users",
  "properties",
  "owners",
  "clients",
  "appointments",
  "property_owners",
  "system_settings",
  "backup_history",
]

// Maximum concurrent image downloads to avoid overwhelming the runtime
const IMAGE_CONCURRENCY = 5

async function downloadWithConcurrency(
  urls: string[],
  concurrency: number,
): Promise<Array<{ url: string; buffer: Buffer | null; filename: string }>> {
  const results: Array<{ url: string; buffer: Buffer | null; filename: string }> = []

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
          if (!res.ok) return { url, buffer: null, filename: "" }
          const arrayBuffer = await res.arrayBuffer()
          const parts = url.split("/")
          const filename = parts[parts.length - 1].split("?")[0]
          return { url, buffer: Buffer.from(arrayBuffer), filename }
        } catch {
          return { url, buffer: null, filename: "" }
        }
      }),
    )
    results.push(...batchResults)
  }
  return results
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const scope: "db" | "images" | "both" = body.scope ?? "both"
    const isCron = body.cron === true

    // Auth: cron uses BACKUP_CRON_SECRET, manual calls require ADMIN user
    if (isCron) {
      const secret = request.headers.get("x-backup-secret")
      if (!secret || secret !== process.env.BACKUP_CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else {
      const user = await getCurrentUser()
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const adminClient = createAdminClient()
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN not configured" }, { status: 500 })
    }

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "-") // HH-MM-SS

    // --- Insert backup_history row as "running" ---
    const { data: historyRow, error: historyError } = await adminClient
      .from("backup_history")
      .insert({
        type: isCron ? "scheduled" : "manual",
        backup_scope: scope,
        status: "running",
      })
      .select("id")
      .single()

    if (historyError || !historyRow) {
      return NextResponse.json({ error: "Could not create backup record" }, { status: 500 })
    }

    const backupId = historyRow.id
    const updateHistory = (patch: Record<string, unknown>) =>
      adminClient.from("backup_history").update(patch).eq("id", backupId)

    // ─────────────────────────────────────────────
    // DB BACKUP
    // ─────────────────────────────────────────────
    let blobUrlDb: string | undefined
    let fileNameDb: string | undefined
    let fileSizeDb: number | undefined
    let tablesCount = 0

    if (scope === "db" || scope === "both") {
      const dbExport: Record<string, unknown[]> = {}

      for (const table of DB_TABLES) {
        const { data, error } = await adminClient.from(table).select("*")
        if (!error && data) {
          dbExport[table] = data
          tablesCount++
        }
      }

      const jsonStr = JSON.stringify(
        { exported_at: now.toISOString(), tables: tablesCount, data: dbExport },
        null,
        2,
      )
      const jsonBuffer = Buffer.from(jsonStr, "utf-8")
      fileNameDb = `backup-db-${dateStr}-${timeStr}.json`

      const blob = await put(`backups/db/${fileNameDb}`, jsonBuffer, {
        access: "public",
        token,
        contentType: "application/json",
      })

      blobUrlDb = blob.url
      fileSizeDb = jsonBuffer.byteLength
    }

    // ─────────────────────────────────────────────
    // IMAGES BACKUP (ZIP)
    // ─────────────────────────────────────────────
    let blobUrlImages: string | undefined
    let fileNameImages: string | undefined
    let fileSizeImages: number | undefined
    let imagesCount = 0

    if (scope === "images" || scope === "both") {
      // Collect all image URLs from properties
      const { data: properties } = await adminClient
        .from("properties")
        .select("id, images")

      const imageEntries: Array<{ propertyId: string; url: string }> = []

      for (const prop of properties ?? []) {
        if (!Array.isArray(prop.images)) continue
        for (const img of prop.images) {
          const parsed = typeof img === "string" ? JSON.parse(img).catch?.(() => img) ?? img : img
          const url = typeof parsed === "string" ? parsed : parsed?.url
          if (url && typeof url === "string" && url.startsWith("http")) {
            imageEntries.push({ propertyId: prop.id, url })
          }
        }
      }

      // Download images with concurrency limit
      const downloaded = await downloadWithConcurrency(
        imageEntries.map((e) => e.url),
        IMAGE_CONCURRENCY,
      )

      // Build ZIP organised by property folder
      const zip = new JSZip()
      const imagesFolder = zip.folder("imagenes")!
      const urlToPropertyId = new Map(imageEntries.map((e) => [e.url, e.propertyId]))

      for (const item of downloaded) {
        if (!item.buffer || !item.filename) continue
        const propId = urlToPropertyId.get(item.url) ?? "sin-propiedad"
        const folder = imagesFolder.folder(`propiedad-${propId}`)!
        folder.file(item.filename, item.buffer)
        imagesCount++
      }

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
      fileNameImages = `backup-images-${dateStr}-${timeStr}.zip`

      const blob = await put(`backups/images/${fileNameImages}`, zipBuffer, {
        access: "public",
        token,
        contentType: "application/zip",
      })

      blobUrlImages = blob.url
      fileSizeImages = zipBuffer.byteLength
    }

    // ─────────────────────────────────────────────
    // Mark backup as completed
    // ─────────────────────────────────────────────
    await updateHistory({
      status: "completed",
      blob_url_db: blobUrlDb,
      blob_url_images: blobUrlImages,
      file_name_db: fileNameDb,
      file_name_images: fileNameImages,
      file_size_db: fileSizeDb,
      file_size_images: fileSizeImages,
      tables_count: tablesCount || null,
      images_count: imagesCount || null,
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      backupId,
      scope,
      db: blobUrlDb ? { url: blobUrlDb, fileName: fileNameDb, sizeBytes: fileSizeDb, tables: tablesCount } : null,
      images: blobUrlImages ? { url: blobUrlImages, fileName: fileNameImages, sizeBytes: fileSizeImages, count: imagesCount } : null,
    })
  } catch (error: any) {
    console.error("[backup] Fatal error:", error)
    return NextResponse.json({ error: error.message ?? "Unknown error" }, { status: 500 })
  }
}
