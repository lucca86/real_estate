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
export async function geocodeAddress(address: string, city?: string, state?: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=20&countrycodes=ar&addressdetails=1`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Real Estate Management App",
      },
    })

    if (!response.ok) {

      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return null
    }

    const scoredResults = data.map((result: any) => {
      const displayName = result.display_name.toLowerCase()
      const addressDetails = result.address || {}
      let score = 0

      if (city && state) {
        const normalizedCity = city === "Ciudad Autónoma de Buenos Aires" || city === "Capital" ? "Buenos Aires" : city
        const resultCity = addressDetails.city || addressDetails.town || addressDetails.municipality || ""
        const resultState = addressDetails.state || ""

        // Boost score if city matches
        if (
          resultCity.toLowerCase().includes(normalizedCity.toLowerCase()) ||
          displayName.includes(normalizedCity.toLowerCase())
        ) {
          score += 100
        }

        // Boost score if state matches
        if (resultState.toLowerCase().includes(state.toLowerCase()) || displayName.includes(state.toLowerCase())) {
          score += 50
        }
      }

      // Prefer results with house numbers
      if (addressDetails.house_number) {
        score += 50
      }

      // Prefer results with road/street names
      if (addressDetails.road) {
        score += 30
      }

      // Use OSM importance score
      if (result.importance) {
        score += result.importance * 10
      }

      // Prefer building/residential results
      if (result.type === "house" || result.type === "building" || result.type === "residential") {
        score += 40
      }

      return { ...result, score }
    })

    scoredResults.sort((a: any, b: any) => b.score - a.score)

    const result = scoredResults[0]

    return {
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
      displayName: result.display_name,
    }
  } catch {
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
  const normalizedCity = city === "Ciudad Autónoma de Buenos Aires" ? "Buenos Aires" : city

  const correctedAddress = correctStreetName(address)
  const expandedAddress = expandAbbreviations(correctedAddress)

  const strategies = [
    `${expandedAddress}, ${normalizedCity}, ${state}, ${country}`,
    neighborhood ? `${expandedAddress}, ${neighborhood}, ${normalizedCity}, ${state}, ${country}` : null,
    address !== expandedAddress ? `${address}, ${normalizedCity}, ${state}, ${country}` : null,
    `${expandedAddress}, ${normalizedCity}, ${country}`,
    `${expandedAddress.replace(/\d+/g, "").trim()}, ${normalizedCity}, ${state}, ${country}`,
    `${expandedAddress.split(",")[0]}, ${normalizedCity}, ${country}`,
    `${normalizedCity}, ${state}, ${country}`,
  ].filter(Boolean) as string[]

  for (let i = 0; i < strategies.length; i++) {
    const strategyAddress = strategies[i]

    const result = await geocodeAddress(strategyAddress, normalizedCity, state)
    if (result) {
      return result
    }

    if (i < strategies.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return null
}
