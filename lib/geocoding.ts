interface GeocodingResult {
  latitude: number
  longitude: number
  displayName: string
}

/**
 * Correct common misspellings of Argentine street names
 */
function correctStreetName(street: string): string {
  const corrections: Record<string, string> = {
    // Hipólito Yrigoyen variations
    irogyen: "yrigoyen",
    irigoyen: "yrigoyen",
    "hipolito irogyen": "hipolito yrigoyen",
    "hipólito irogyen": "hipólito yrigoyen",
    // Other common corrections
    "san martin": "san martín",
    colon: "colón",
    cordoba: "córdoba",
  }

  let corrected = street.toLowerCase()
  for (const [wrong, right] of Object.entries(corrections)) {
    corrected = corrected.replace(new RegExp(wrong, "gi"), right)
  }

  // Capitalize first letter of each word
  return corrected.replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Expand common Spanish address abbreviations
 */
function expandAbbreviations(text: string): string {
  const abbreviations: Record<string, string> = {
    "Tte.": "Teniente",
    "Cnel.": "Coronel",
    "Gral.": "General",
    "Cap.": "Capitán",
    "Av.": "Avenida",
    "Bv.": "Boulevard",
    "Dr.": "Doctor",
    "Ing.": "Ingeniero",
    "Pte.": "Presidente",
    "Sgto.": "Sargento",
  }

  let expanded = text
  for (const [abbr, full] of Object.entries(abbreviations)) {
    expanded = expanded.replace(new RegExp(abbr, "gi"), full)
  }
  return expanded
}

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 * Free service, no API key required
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=10&countrycodes=ar&addressdetails=1`

    console.log("[v0] Geocoding URL:", url)

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Real Estate Management App",
      },
    })

    if (!response.ok) {
      console.error("[v0] Geocoding API error:", response.statusText)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.log("[v0] No geocoding results found for address:", address)
      return null
    }

    const preferredResult = data.find((result: any) => {
      const displayName = result.display_name.toLowerCase()
      const addressDetails = result.address || {}

      const isCorrientsesCapital =
        (addressDetails.city === "Corrientes" ||
          addressDetails.town === "Corrientes" ||
          addressDetails.municipality === "Corrientes") &&
        (addressDetails.state === "Corrientes" || addressDetails.state === "Provincia de Corrientes") &&
        !displayName.includes("paso de la patria") &&
        !displayName.includes("santa ana") &&
        !displayName.includes("riachuelo") &&
        !displayName.includes("empedrado")

      return isCorrientsesCapital
    })

    const result = preferredResult || data[0]

    console.log("[v0] Selected geocoding result:", result.display_name)
    console.log("[v0] Coordinates:", result.lat, result.lon)

    return {
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
      displayName: result.display_name,
    }
  } catch (error) {
    console.error("[v0] Geocoding error:", error)
    return null
  }
}

/**
 * Geocode a property address by combining address components
 * Tries multiple strategies to find the location
 */
export async function geocodeProperty(
  address: string,
  city: string,
  state: string,
  country = "Argentina",
  neighborhood?: string,
): Promise<GeocodingResult | null> {
  console.log("[v0] Starting geocoding with:", { address, city, state, neighborhood })

  // Normalize city name - don't use "Capital"
  const normalizedCity = city === "Capital" ? "Corrientes" : city

  // Strategy 1: Correct common street name errors
  const correctedAddress = correctStreetName(address)
  if (correctedAddress !== address) {
    console.log("[v0] Corrected street name:", address, "->", correctedAddress)
  }

  // Strategy 2: Expand abbreviations
  const expandedAddress = expandAbbreviations(correctedAddress)

  const strategies = [
    // Try with corrected address, neighborhood, and city
    neighborhood ? `${expandedAddress}, ${neighborhood}, ${normalizedCity}, ${state}, ${country}` : null,

    // Try with corrected address and city (no neighborhood)
    `${expandedAddress}, ${normalizedCity}, ${state}, ${country}`,

    // Try without street number
    `${expandedAddress.replace(/\d+/g, "").trim()}, ${normalizedCity}, ${state}, ${country}`,

    // Try with just street name and city (very broad)
    `${expandedAddress.split(" ")[0]}, ${normalizedCity}, ${country}`,

    // Try with original address (in case correction was wrong)
    address !== correctedAddress ? `${address}, ${normalizedCity}, ${state}, ${country}` : null,

    // Last resort: just city and state
    `${normalizedCity}, ${state}, ${country}`,
  ].filter(Boolean) as string[]

  for (let i = 0; i < strategies.length; i++) {
    const strategyAddress = strategies[i]
    console.log(`[v0] Strategy ${i + 1}/${strategies.length}:`, strategyAddress)

    const result = await geocodeAddress(strategyAddress)
    if (result) {
      console.log(`[v0] ✓ Geocoding successful with strategy ${i + 1}`)
      return result
    }

    // Small delay to avoid rate limiting
    if (i < strategies.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.error("[v0] All geocoding strategies failed")
  return null
}
