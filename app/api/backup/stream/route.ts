import { put } from "@vercel/blob"
import JSZip from "jszip"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { getSystemSetting } from "@/lib/actions/system-settings"

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

const IMAGE_CONCURRENCY = 5

function encode(event: string, data: object) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  // Auth check using the custom JWT session cookie (this app does NOT use Supabase Auth)
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (currentUser.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 })
  }

  const adminClient = createAdminClient()

  const { scope } = await req.json() as { scope: "db" | "images" | "both" }
  const token = process.env.BLOB_READ_WRITE_TOKEN

  if (!token) {
    return new Response("BLOB_READ_WRITE_TOKEN no configurado", { status: 500 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: object) => {
        try {
          controller.enqueue(new TextEncoder().encode(encode(event, data)))
        } catch {
          // client disconnected
        }
      }

      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      const timeStr = now.toISOString().slice(11, 19).replace(/:/g, "-")

      // Steps definition: [id, label, weight]
      // weight determines visual proportion of the progress bar
      type Step = { id: string; label: string }
      const dbSteps: Step[] = [
        { id: "init", label: "Iniciando backup..." },
        { id: "db_export", label: "Exportando tablas de la base de datos..." },
        { id: "db_upload", label: "Subiendo backup de BD a Vercel Blob..." },
      ]
      const imgSteps: Step[] = [
        { id: "img_query", label: "Consultando imágenes de propiedades..." },
        { id: "img_download", label: "Descargando imágenes..." },
        { id: "img_zip", label: "Generando archivo ZIP..." },
        { id: "img_upload", label: "Subiendo ZIP a Vercel Blob..." },
      ]
      const finalStep: Step = { id: "done", label: "Finalizando y registrando backup..." }

      const steps: Step[] =
        scope === "db"
          ? [...dbSteps, finalStep]
          : scope === "images"
          ? [{ id: "init", label: "Iniciando backup..." }, ...imgSteps, finalStep]
          : [...dbSteps, ...imgSteps, finalStep]

      const total = steps.length
      let current = 0

      const progress = (step: Step) => {
        current++
        emit("progress", {
          step: step.id,
          label: step.label,
          current,
          total,
          percent: Math.round((current / total) * 100),
        })
      }

      // ── Insert history row ────────────────────────────────────────────────
      progress(steps[0]) // "init"

      const { data: historyRow, error: historyError } = await adminClient
        .from("backup_history")
        .insert({
          type: "manual",
          backup_scope: scope,
          status: "running",
          created_by_id: currentUser.id,
        })
        .select("id")
        .single()

      if (historyError || !historyRow) {
        emit("error", { message: "No se pudo crear el registro en la base de datos" })
        controller.close()
        return
      }

      const backupId = historyRow.id
      const updateHistory = (patch: Record<string, unknown>) =>
        adminClient.from("backup_history").update(patch).eq("id", backupId)

      let blobUrlDb: string | undefined
      let fileNameDb: string | undefined
      let fileSizeDb: number | undefined
      let tablesCount = 0
      let blobUrlImages: string | undefined
      let fileNameImages: string | undefined
      let fileSizeImages: number | undefined
      let imagesCount = 0

      try {
        // ── DB Backup ─────────────────────────────────────────────────────────
        if (scope === "db" || scope === "both") {
          progress(steps.find((s) => s.id === "db_export")!)

          const dbExport: Record<string, unknown[]> = {}
          for (const table of DB_TABLES) {
            const { data, error } = await adminClient.from(table).select("*")
            if (!error && data) {
              dbExport[table] = data
              tablesCount++
            }
            // Emit partial progress per table so it feels alive
            emit("detail", { message: `Exportando tabla: ${table}` })
          }

          progress(steps.find((s) => s.id === "db_upload")!)
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

        // ── Images Backup ─────────────────────────────────────────────────────
        if (scope === "images" || scope === "both") {
          progress(steps.find((s) => s.id === "img_query")!)
          const { data: properties } = await adminClient
            .from("properties")
            .select("id, images")

          const imageEntries: Array<{ propertyId: string; url: string }> = []
          for (const prop of properties ?? []) {
            if (!Array.isArray(prop.images)) continue
            for (const img of prop.images) {
              let parsed = img
              if (typeof img === "string") {
                try { parsed = JSON.parse(img) } catch { parsed = img }
              }
              const url = typeof parsed === "string" ? parsed : parsed?.url
              if (url && typeof url === "string" && url.startsWith("http")) {
                imageEntries.push({ propertyId: prop.id, url })
              }
            }
          }

          emit("detail", { message: `${imageEntries.length} imágenes encontradas en ${properties?.length ?? 0} propiedades` })

          progress(steps.find((s) => s.id === "img_download")!)

          // Download with progress per batch
          const downloaded: Array<{ url: string; buffer: Buffer | null; filename: string }> = []
          for (let i = 0; i < imageEntries.length; i += IMAGE_CONCURRENCY) {
            const batch = imageEntries.slice(i, i + IMAGE_CONCURRENCY)
            const results = await Promise.all(
              batch.map(async (entry) => {
                try {
                  const res = await fetch(entry.url, { signal: AbortSignal.timeout(30_000) })
                  if (!res.ok) return { url: entry.url, buffer: null, filename: "" }
                  const ab = await res.arrayBuffer()
                  const parts = entry.url.split("/")
                  const filename = parts[parts.length - 1].split("?")[0]
                  return { url: entry.url, buffer: Buffer.from(ab), filename }
                } catch {
                  return { url: entry.url, buffer: null, filename: "" }
                }
              }),
            )
            downloaded.push(...results)
            const done = Math.min(i + IMAGE_CONCURRENCY, imageEntries.length)
            emit("detail", { message: `Descargando imágenes: ${done} / ${imageEntries.length}` })
          }

          progress(steps.find((s) => s.id === "img_zip")!)
          const zip = new JSZip()
          const imagesFolder = zip.folder("imagenes")!
          const urlToPropertyId = new Map(imageEntries.map((e) => [e.url, e.propertyId]))

          for (const item of downloaded) {
            if (!item.buffer || !item.filename) continue
            const propId = urlToPropertyId.get(item.url) ?? "sin-propiedad"
            imagesFolder.folder(`propiedad-${propId}`)!.file(item.filename, item.buffer)
            imagesCount++
          }

          progress(steps.find((s) => s.id === "img_upload")!)
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

        // ── Finalize ──────────────────────────────────────────────────────────
        progress(finalStep)

        await updateHistory({
          status: "completed",
          blob_url_db: blobUrlDb ?? null,
          blob_url_images: blobUrlImages ?? null,
          file_name_db: fileNameDb ?? null,
          file_name_images: fileNameImages ?? null,
          file_size_db: fileSizeDb ?? null,
          file_size_images: fileSizeImages ?? null,
          tables_count: tablesCount || null,
          images_count: imagesCount || null,
          completed_at: new Date().toISOString(),
        })

        // Retention enforcement
        const retention = await getSystemSetting("backup_retention")
        if (retention) {
          const max = parseInt(retention, 10)
          const { data } = await adminClient
            .from("backup_history")
            .select("id")
            .eq("status", "completed")
            .order("created_at", { ascending: false })
          if (data && data.length > max) {
            const toDelete = data.slice(max).map((r: any) => r.id)
            await adminClient.from("backup_history").delete().in("id", toDelete)
          }
        }

        emit("complete", {
          backupId,
          blobUrlDb: blobUrlDb ?? null,
          blobUrlImages: blobUrlImages ?? null,
          fileNameDb: fileNameDb ?? null,
          fileNameImages: fileNameImages ?? null,
          fileSizeDb: fileSizeDb ?? null,
          fileSizeImages: fileSizeImages ?? null,
          tablesCount,
          imagesCount,
          completedAt: new Date().toISOString(),
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido"
        await updateHistory({
          status: "failed",
          error_message: msg,
          completed_at: new Date().toISOString(),
        })
        emit("error", { message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
