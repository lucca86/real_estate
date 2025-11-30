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
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=20&countrycodes=ar&addressdetails=1&bounded=1&viewbox=-58.9,-27.3,-58.7,-27.6`

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

    const scoredResults = data.map((result: any) => {
      const displayName = result.display_name.toLowerCase()
      const addressDetails = result.address || {}
      let score = 0

      // Check if it's in Corrientes Capital
      const isCorrientsesCapital =
        (addressDetails.city === "Corrientes" ||
          addressDetails.town === "Corrientes" ||
          addressDetails.municipality === "Corrientes") &&
        (addressDetails.state === "Corrientes" || addressDetails.state === "Provincia de Corrientes")

      if (isCorrientsesCapital) {
        score += 100
      }

      // Exclude nearby towns that often appear in results
      const excludedLocations = ["paso de la patria", "santa ana", "riachuelo", "empedrado", "san luis del palmar"]
      if (excludedLocations.some((location) => displayName.includes(location))) {
        score -= 200
      }

      // Prioritize results with house numbers
      if (addressDetails.house_number) {
        score += 50
      }

      // Prioritize results with road/street names
      if (addressDetails.road) {
        score += 30
      }

      // Check importance score from Nominatim (higher is better)
      if (result.importance) {
        score += result.importance * 10
      }

      // Prioritize results with type "house" or "building"
      if (result.type === "house" || result.type === "building" || result.type === "residential") {
        score += 40
      }

      return { ...result, score }
    })

    // Sort by score descending
    scoredResults.sort((a: any, b: any) => b.score - a.score)

    const result = scoredResults[0]

    console.log("[v0] Selected geocoding result:", result.display_name)
    console.log("[v0] Score:", result.score)
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
 * Uses OpenStreetMap Nominatim for geocoding
 */
export async function geocodeProperty(
  address: string,
  city: string,
  state: string,
  country = "Argentina",
  neighborhood?: string,
): Promise<GeocodingResult | null> {
  console.log("[v0] Starting geocoding with:", { address, city, state, neighborhood, country })

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
    // PRIORITY 1: Exact address with street number and city
    `${expandedAddress}, ${normalizedCity}, ${state}, ${country}`,

    // PRIORITY 2: With neighborhood if available
    neighborhood ? `${expandedAddress}, ${neighborhood}, ${normalizedCity}, ${state}, ${country}` : null,

    // PRIORITY 3: Try original address (in case expansion caused issues)
    address !== expandedAddress ? `${address}, ${normalizedCity}, ${state}, ${country}` : null,

    // PRIORITY 4: Just address and city (no state for simpler search)
    `${expandedAddress}, ${normalizedCity}, ${country}`,

    // PRIORITY 5: Without street number (if above failed)
    `${expandedAddress.replace(/\d+/g, "").trim()}, ${normalizedCity}, ${state}, ${country}`,

    // PRIORITY 6: Just street name and city (very broad)
    `${expandedAddress.split(",")[0]}, ${normalizedCity}, ${country}`,

    // Last resort: just city and state
    `${normalizedCity}, ${state}, ${country}`,
  ].filter(Boolean) as string[]

  for (let i = 0; i < strategies.length; i++) {
    const strategyAddress = strategies[i]
    console.log(`[v0] Nominatim strategy ${i + 1}/${strategies.length}:`, strategyAddress)

    const result = await geocodeAddress(strategyAddress)
    if (result) {
      console.log(`[v0] ✓ Nominatim geocoding successful with strategy ${i + 1}`)
      return result
    }

    // Small delay to avoid rate limiting
    if (i < strategies.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.error("[v0] All geocoding strategies failed")
  return null
}
