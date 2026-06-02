import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth"

// Taxonomy keys Estatik uses for location (confirmed from debug output)
const TAXONOMY_LOCATION_KEYS = ["es_locations", "es_location", "es_neighborhoods", "es_neighborhood"]

// Meta keys we also send as fallback
const OUR_META_KEYS = [
  "es_country", "es_state", "es_city", "es_neighborhood",
  "es_property_postal_code", "es_property_address",
  "es_property_latitude", "es_property_longitude",
]

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const wpId = req.nextUrl.searchParams.get("id")
  if (!wpId) {
    return NextResponse.json({ error: "Se requiere el parámetro id" }, { status: 400 })
  }

  // Build base URL exactly as lib/wordpress.ts does
  let baseUrl = (process.env.WORDPRESS_API_URL || "").trim().replace(/\/$/, "")
  if (baseUrl && !baseUrl.endsWith("/wp-json")) baseUrl = `${baseUrl}/wp-json`

  const username = process.env.WORDPRESS_USERNAME || ""
  const password = process.env.WORDPRESS_APP_PASSWORD || ""

  if (!baseUrl || !username || !password) {
    return NextResponse.json({
      error: "Variables de WordPress no configuradas",
      configured: {
        WORDPRESS_API_URL: !!process.env.WORDPRESS_API_URL,
        WORDPRESS_USERNAME: !!process.env.WORDPRESS_USERNAME,
        WORDPRESS_APP_PASSWORD: !!process.env.WORDPRESS_APP_PASSWORD,
      },
    }, { status: 500 })
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64")
  const headers = {
    Authorization: `Basic ${credentials}`,
    "Content-Type": "application/json",
  }

  // Try endpoints in the same order the sync uses:
  // 1. Estatik bridge (same as createProperty/updateProperty)
  // 2. Native WP REST es_property
  // 3. Native WP REST properties (fallback)
  const candidates = [
    `${baseUrl}/estatik-bridge/v1/properties/${wpId}`,
    `${baseUrl}/wp/v2/es_property/${wpId}?context=edit`,
    `${baseUrl}/wp/v2/properties/${wpId}?context=edit`,
  ]

  let rawData: any = null
  let usedEndpoint = ""

  for (const url of candidates) {
    const res = await fetch(url, { headers, cache: "no-store" })
    if (res.ok) {
      rawData = await res.json()
      usedEndpoint = url
      break
    }
  }

  if (!rawData) {
    return NextResponse.json({
      error: `No se pudo leer la propiedad WP #${wpId} en ningún endpoint`,
      testedUrls: candidates,
    }, { status: 404 })
  }

  // Bridge returns flat object with meta nested; WP REST wraps in .meta
  const meta: Record<string, any> = rawData.meta || rawData
  const title: string =
    (typeof rawData.title === "object" ? rawData.title?.rendered : rawData.title) ||
    rawData.post_title ||
    `WP #${wpId}`

  const allMetaKeys = Object.keys(meta).sort()

  // Check taxonomy terms (primary location storage in this WP install)
  const taxonomyStatus: Record<string, { exists: boolean; hasValue: boolean; value: string }> = {}
  for (const key of TAXONOMY_LOCATION_KEYS) {
    const raw = rawData[key]
    const exists = key in rawData
    const ids: number[] = Array.isArray(raw) ? raw : []
    const hasValue = ids.length > 0
    taxonomyStatus[key] = { exists, hasValue, value: hasValue ? `[${ids.join(", ")}]` : "(vacío)" }
  }

  // Check meta keys (secondary fallback)
  const ourKeysStatus: Record<string, { exists: boolean; hasValue: boolean; value: string }> = {}
  for (const key of OUR_META_KEYS) {
    const exists = key in meta
    const raw = meta[key]
    const value = Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")
    const hasValue = exists && value !== "" && value !== "0"
    ourKeysStatus[key] = { exists, hasValue, value }
  }

  // Issues — now based on taxonomy terms, not meta keys
  const issues: string[] = []
  const locationTaxHasValue = TAXONOMY_LOCATION_KEYS.slice(0, 2).some((k) => taxonomyStatus[k]?.hasValue)
  const neighborhoodTaxHasValue = TAXONOMY_LOCATION_KEYS.slice(2).some((k) => taxonomyStatus[k]?.hasValue)
  if (!locationTaxHasValue) issues.push("La taxonomia de ubicación (es_location / es_locations) está vacía — la dirección no se mostrará en WordPress")
  if (!neighborhoodTaxHasValue) issues.push("La taxonomia de barrio (es_neighborhood / es_neighborhoods) está vacía")
  if (issues.length === 0) issues.push("OK — las taxonomías de ubicación tienen valores")

  const recommendations: Record<string, string> = {
    nota: "Esta instalación usa TAXONOMÍAS para la ubicación, no meta keys. Los términos se asignan via es_location (ciudad/provincia) y es_neighborhood (barrio).",
  }

  return NextResponse.json({
    propertyId: Number(wpId),
    title,
    usedEndpoint,
    // Taxonomy check (primary — what WP actually uses)
    taxonomyStatus,
    // Meta key check (secondary fallback)
    ourKeysStatus,
    allMetaKeys,
    issues,
    recommendations,
    rawTopLevelKeys: Object.keys(rawData).sort(),
    rawData,
  })
}
