import JSZip from "jszip"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"

const CONCURRENCY = 8

export async function POST(req: Request) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return new Response("Unauthorized", { status: 401 })
  if (currentUser.role !== "ADMIN") return new Response("Forbidden", { status: 403 })

  const { manifestUrl } = (await req.json()) as { manifestUrl?: string }

  const adminClient = createAdminClient()

  // Load image URLs — from manifest if provided, or live from DB
  let entries: Array<{ propertyId: string; propertyTitle: string; url: string }> = []

  if (manifestUrl) {
    // Use the saved manifest for point-in-time accuracy
    const res = await fetch(manifestUrl)
    if (!res.ok) return new Response("No se pudo leer el manifiesto", { status: 400 })
    const manifest = await res.json()
    for (const prop of manifest.properties ?? []) {
      for (const img of prop.images ?? []) {
        entries.push({ propertyId: prop.propertyId, propertyTitle: prop.propertyTitle, url: img.url })
      }
    }
  } else {
    // Live query — current state of DB
    const { data: properties } = await adminClient
      .from("properties")
      .select("id, title, images")

    for (const prop of properties ?? []) {
      if (!Array.isArray(prop.images)) continue
      for (const img of prop.images) {
        let parsed = img
        if (typeof img === "string") {
          try { parsed = JSON.parse(img) } catch { parsed = img }
        }
        const url = typeof parsed === "string" ? parsed : parsed?.url
        if (url && typeof url === "string" && url.startsWith("http")) {
          entries.push({ propertyId: prop.id, propertyTitle: prop.title ?? prop.id, url })
        }
      }
    }
  }

  if (entries.length === 0) {
    return new Response("No hay imágenes para descargar", { status: 404 })
  }

  // Download images in parallel batches
  const zip = new JSZip()

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (entry) => {
        try {
          const res = await fetch(entry.url, { signal: AbortSignal.timeout(20_000) })
          if (!res.ok) return
          const buffer = Buffer.from(await res.arrayBuffer())
          // Safe folder name: use title truncated + id suffix
          const safeName = (entry.propertyTitle || entry.propertyId)
            .replace(/[^a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]/g, "")
            .trim()
            .slice(0, 40)
          const folderName = `${safeName} (${entry.propertyId.slice(0, 8)})`
          const parts = entry.url.split("/")
          const filename = parts[parts.length - 1].split("?")[0] || `imagen-${Date.now()}.webp`
          zip.folder(folderName)!.file(filename, buffer)
        } catch {
          // skip failed image — don't abort the whole ZIP
        }
      }),
    )
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 3 }, // fast, images are already compressed
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `imagenes-propiedades-${dateStr}.zip`

  // Response BodyInit requires Uint8Array, not Node.js Buffer
  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(zipBuffer.byteLength),
    },
  })
}
