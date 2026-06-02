/**
 * DEBUG: Inspecciona exactamente qué datos de dirección están guardados en WordPress
 * y compara con lo que estamos enviando.
 * 
 * CÓMO USAR:
 * 1. En el endpoint /api/wordpress/debug-property (necesitamos crear)
 * 2. Pasar un WordPress post ID existente
 * 3. Verá exactamente qué meta keys están guardadas y sus valores
 */

import { wordpressAPI } from "./wordpress-api"

interface DebugResult {
  wordPressData: {
    id: number
    title: string
    allMetaKeys: Record<string, any>
    locationFields: {
      country: string | null
      province: string | null
      city: string | null
      neighborhood: string | null
      postal_code: string | null
      address: string | null
      latitude: string | null
      longitude: string | null
    }
  }
  ourPayloadMapping: {
    whatWeSend: Record<string, string>
    machineNamesWeUse: string[]
  }
  analysis: {
    issues: string[]
    recommendations: string[]
    mappingMatch: boolean
  }
}

export async function debugWordPressProperty(wpPostId: number): Promise<DebugResult> {
  console.log("[DEBUG] Fetching WordPress property:", wpPostId)

  // GET the property from WordPress
  const response = await fetch(
    `${process.env.WORDPRESS_URL}/wp-json/wp/v2/estatik_property/${wpPostId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.WORDPRESS_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.statusText}`)
  }

  const wpData = await response.json()

  // Extract location-related meta keys
  const allMeta = wpData.meta || {}
  const locationFields = {
    country: allMeta.country || allMeta.es_country || null,
    province: allMeta.province || allMeta.es_state || null,
    city: allMeta.city || allMeta.es_city || null,
    neighborhood: allMeta.es_neighborhood || null,
    postal_code: allMeta.postal_code || allMeta.es_property_postal_code || null,
    address: allMeta.es_property_address || null,
    latitude: allMeta.es_property_latitude || null,
    longitude: allMeta.es_property_longitude || null,
  }

  // Mapping que usamos en nuestro código
  const ourPayloadMapping = {
    whatWeSend: {
      "country": "String from property.country",
      "es_country": "String from property.country",
      "province": "String from property.province",
      "es_state": "String from property.province",
      "city": "String from property.city",
      "es_city": "String from property.city",
      "es_neighborhood": "String from property.neighborhood",
      "postal_code": "String from property.zipCode",
      "es_property_postal_code": "String from property.zipCode",
      "es_property_address": "Composed address string",
      "es_property_latitude": "Numeric coordinates",
      "es_property_longitude": "Numeric coordinates",
    },
    machineNamesWeUse: [
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
    ],
  }

  // Analysis
  const issues: string[] = []
  const recommendations: string[] = []

  // Check which fields are empty or missing
  if (!locationFields.country) {
    issues.push("❌ Country field is EMPTY in WordPress")
    recommendations.push("→ Check if machine name 'country' or 'es_country' is correct in Estatik Fields Builder")
  }
  if (!locationFields.province) {
    issues.push("❌ Province field is EMPTY in WordPress")
    recommendations.push("→ Check if machine name 'province' or 'es_state' is correct")
  }
  if (!locationFields.city) {
    issues.push("❌ City field is EMPTY in WordPress")
    recommendations.push("→ Check if machine name 'city' or 'es_city' is correct")
  }
  if (!locationFields.neighborhood) {
    issues.push("❌ Neighborhood field is EMPTY in WordPress")
    recommendations.push("→ Check if machine name 'es_neighborhood' is correct")
  }

  // Check if coordinates exist
  if (locationFields.latitude && locationFields.longitude) {
    console.log("[DEBUG] ✓ Coordinates ARE being saved correctly")
  } else {
    issues.push("⚠ Latitude/Longitude are NOT being saved")
  }

  // Check if address is being saved
  if (locationFields.address) {
    console.log("[DEBUG] ✓ Address string IS being saved to es_property_address")
  } else {
    issues.push("⚠ Full address is NOT in es_property_address")
  }

  // Try to identify the REAL machine names from WordPress
  const potentialLocationKeys = Object.entries(allMeta)
    .filter(([key]) => 
      key.includes("address") || 
      key.includes("location") || 
      key.includes("country") || 
      key.includes("city") ||
      key.includes("province") ||
      key.includes("state") ||
      key.includes("neighborhood") ||
      key.includes("postal") ||
      key.includes("zip")
    )
    .map(([key, value]) => `${key} = ${typeof value === "object" ? JSON.stringify(value) : value}`)

  if (potentialLocationKeys.length > 0) {
    console.log("[DEBUG] Found potential location meta keys in WordPress:")
    potentialLocationKeys.forEach((k) => console.log(`  → ${k}`))
    recommendations.push(`→ Real WordPress meta keys being used: ${potentialLocationKeys.join(", ")}`)
  }

  return {
    wordPressData: {
      id: wpData.id,
      title: wpData.title?.rendered || wpData.title || "N/A",
      allMetaKeys: allMeta,
      locationFields,
    },
    ourPayloadMapping,
    analysis: {
      issues,
      recommendations,
      mappingMatch: locationFields.country && locationFields.province && locationFields.city,
    },
  }
}
