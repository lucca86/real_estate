/**
 * DEBUG: Inspecciona exactamente qué meta keys de dirección están guardados en WordPress
 * para una propiedad ya sincronizada, y los compara con lo que nuestro código envía.
 *
 * Uso: GET /api/wordpress/debug-property?id={wordpress_post_id}
 */

// Meta keys de dirección que usamos actualmente en lib/wordpress.ts
const OUR_ADDRESS_KEYS = [
  "country",
  "es_country",
  "province",
  "es_state",
  "city",
  "es_city",
  "es_neighborhood",
  "postal_code",
  "es_property_postal_code",
  "es_property_address",
  "es_property_latitude",
  "es_property_longitude",
]

export interface WPDebugResult {
  wpPostId: number
  title: string
  // Todos los meta keys que tiene la propiedad en WP (para ver los nombres reales)
  allMetaKeys: string[]
  // Valores de los campos de dirección que encontramos
  locationMeta: Record<string, string | null>
  // Qué keys de OUR_ADDRESS_KEYS existen en WP y cuáles están vacíos
  ourKeysStatus: { key: string; exists: boolean; value: string | null }[]
  // Análisis automático
  issues: string[]
  recommendations: string[]
}

export async function debugWordPressProperty(wpPostId: number): Promise<WPDebugResult> {
  const baseUrl = (process.env.WORDPRESS_API_URL || "").trim().replace(/\/$/, "")
  const username = process.env.WORDPRESS_USERNAME || ""
  const password = process.env.WORDPRESS_APP_PASSWORD || ""

  if (!baseUrl) throw new Error("WORDPRESS_API_URL is not configured")
  if (!username || !password) throw new Error("WordPress credentials are not configured")

  const credentials = Buffer.from(`${username}:${password}`).toString("base64")

  // Estatik usa el custom post type "es_property"
  const url = `${baseUrl}/wp/v2/es_property/${wpPostId}?context=edit`

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`WP API error ${response.status}: ${body.slice(0, 300)}`)
  }

  const wpData = await response.json()
  const allMeta: Record<string, any> = wpData.meta || {}
  const allMetaKeys = Object.keys(allMeta).sort()

  // Filtrar solo los keys relacionados con dirección/ubicación
  const locationKeywords = [
    "address", "city", "country", "state", "province", "region",
    "zip", "postal", "code", "neighbor", "hood", "location", "lat", "lon", "geo",
  ]
  const locationMeta: Record<string, string | null> = {}
  for (const [k, v] of Object.entries(allMeta)) {
    if (locationKeywords.some((kw) => k.toLowerCase().includes(kw))) {
      locationMeta[k] = v === "" || v === null || v === undefined ? null : String(v)
    }
  }

  // Estado de cada key que nosotros enviamos
  const ourKeysStatus = OUR_ADDRESS_KEYS.map((key) => {
    const rawValue = allMeta[key]
    const value = rawValue === "" || rawValue === null || rawValue === undefined ? null : String(rawValue)
    return { key, exists: key in allMeta, value }
  })

  // Análisis automático
  const issues: string[] = []
  const recommendations: string[] = []

  const countryKey = ourKeysStatus.find((k) => k.key === "country")
  const provinceKey = ourKeysStatus.find((k) => k.key === "province")
  const cityKey = ourKeysStatus.find((k) => k.key === "city")
  const neighborhoodKey = ourKeysStatus.find((k) => k.key === "es_neighborhood")
  const addressKey = ourKeysStatus.find((k) => k.key === "es_property_address")
  const latKey = ourKeysStatus.find((k) => k.key === "es_property_latitude")

  if (!countryKey?.exists) {
    issues.push("'country' key does NOT exist as meta in this WP property — Estatik may use a different key")
  } else if (!countryKey?.value) {
    issues.push("'country' key EXISTS but is EMPTY — our value is not being saved")
  }

  if (!provinceKey?.exists) {
    issues.push("'province' key does NOT exist — may need 'es_state' or different key")
  } else if (!provinceKey?.value) {
    issues.push("'province' EXISTS but EMPTY")
  }

  if (!cityKey?.exists) {
    issues.push("'city' key does NOT exist — may need 'es_city' or different key")
  } else if (!cityKey?.value) {
    issues.push("'city' EXISTS but EMPTY")
  }

  if (!neighborhoodKey?.value) {
    issues.push("'es_neighborhood' is empty or missing")
  }

  if (!addressKey?.value) {
    issues.push("'es_property_address' is empty — composed address is not being saved")
  }

  if (!latKey?.value) {
    issues.push("'es_property_latitude' is empty — coordinates not being saved")
  }

  // Recomendar los keys reales de WP que contienen datos de ubicación
  const realLocationKeysWithValues = Object.entries(locationMeta)
    .filter(([, v]) => v !== null && v !== "")
    .map(([k, v]) => `${k} = "${v}"`)

  if (realLocationKeysWithValues.length > 0) {
    recommendations.push(
      `Real WP location meta keys with values: ${realLocationKeysWithValues.join(" | ")}`
    )
  } else {
    recommendations.push("No location meta keys have values in WordPress — address data is NOT being saved at all")
  }

  // Keys que WP tiene pero nosotros NO usamos
  const wpLocationKeysNotInOurs = Object.keys(locationMeta).filter(
    (k) => !OUR_ADDRESS_KEYS.includes(k)
  )
  if (wpLocationKeysNotInOurs.length > 0) {
    recommendations.push(
      `WP has these location keys we do NOT send: ${wpLocationKeysNotInOurs.join(", ")}`
    )
  }

  return {
    wpPostId,
    title: typeof wpData.title === "object" ? wpData.title?.rendered : wpData.title || "N/A",
    allMetaKeys,
    locationMeta,
    ourKeysStatus,
    issues,
    recommendations,
  }
}
