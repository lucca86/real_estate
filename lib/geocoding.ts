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

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Real Estate Management App",
      },
    })

    if (!response.ok) {
      console.error("Geocoding API error:", response.statusText)
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

      const isCorrientsesCapital =
        (addressDetails.city === "Corrientes" ||
          addressDetails.town === "Corrientes" ||
          addressDetails.municipality === "Corrientes") &&
        (addressDetails.state === "Corrientes" || addressDetails.state === "Provincia de Corrientes")

      if (isCorrientsesCapital) {
        score += 100
      }

      const excludedLocations = ["paso de la patria", "santa ana", "riachuelo", "empedrado", "san luis del palmar"]
      if (excludedLocations.some((location) => displayName.includes(location))) {
        score -= 200
      }

      if (addressDetails.house_number) {
        score += 50
      }

      if (addressDetails.road) {
        score += 30
      }

      if (result.importance) {
        score += result.importance * 10
      }

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
  } catch (error) {
    console.error("Geocoding error:", error)
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
  const normalizedCity = city === "Capital" ? "Corrientes" : city

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

    const result = await geocodeAddress(strategyAddress)
    if (result) {
      return result
    }

    if (i < strategies.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.error("All geocoding strategies failed")
  return null
}
