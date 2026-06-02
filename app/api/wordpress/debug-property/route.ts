import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth"

const ADDRESS_KEYWORDS = [
  "address", "city", "country", "state", "province", "region",
  "zip", "postal", "code", "neighbor", "hood", "location",
  "lat", "lon", "geo", "street", "suburb", "district", "area",
]

// Keys we currently send in our sync
const OUR_KEYS = [
  "country", "es_country",
  "province", "es_state",
  "city", "es_city",
  "es_neighborhood",
  "postal_code", "es_property_postal_code",
  "es_property_address",
  "es_property_latitude",
  "es_property_longitude",
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

  // Filter address-related meta
  const locationMeta: Record<string, string> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (ADDRESS_KEYWORDS.some((kw) => k.toLowerCase().includes(kw))) {
      locationMeta[k] = Array.isArray(v) ? (v[0] ?? "") : String(v ?? "")
    }
  }

  // Status of each key we send
  const ourKeysStatus: Record<string, { exists: boolean; hasValue: boolean; value: string }> = {}
  for (const key of OUR_KEYS) {
    const exists = key in meta
    const raw = meta[key]
    const value = Array.isArray(raw) ? (raw[0] ?? "") : String(raw ?? "")
    const hasValue = exists && value !== "" && value !== "0"
    ourKeysStatus[key] = { exists, hasValue, value }
  }

  // Issues
  const issues: string[] = []
  const missingOurs = OUR_KEYS.filter((k) => !ourKeysStatus[k].exists)
  const emptyOurs = OUR_KEYS.filter((k) => ourKeysStatus[k].exists && !ourKeysStatus[k].hasValue)
  if (missingOurs.length > 0) issues.push(`Keys que enviamos pero NO existen en WP: ${missingOurs.join(", ")}`)
  if (emptyOurs.length > 0) issues.push(`Keys que existen pero están VACÍOS: ${emptyOurs.join(", ")}`)

  // Detect real machine names WP is using (keys that have values)
  const recommendations: Record<string, string> = {}
  for (const [k, v] of Object.entries(locationMeta)) {
    if (!v) continue
    const lk = k.toLowerCase()
    if (lk.includes("city")) recommendations["ciudad"] = k
    else if (lk.includes("country")) recommendations["pais"] = k
    else if (lk.includes("province") || lk.includes("state")) recommendations["provincia"] = k
    else if (lk.includes("neighbor") || lk.includes("hood")) recommendations["barrio"] = k
    else if (lk.includes("postal") || lk.includes("zip")) recommendations["codigo_postal"] = k
    else if (lk.includes("address")) recommendations["direccion"] = k
  }

  return NextResponse.json({
    propertyId: Number(wpId),
    title,
    usedEndpoint,
    allMetaKeys,
    locationMeta,
    ourKeysStatus,
    issues,
    recommendations,
  })
}
