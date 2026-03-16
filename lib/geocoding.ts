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
 * Geocode an address using Nominatim structured search (OpenStreetMap)
 * Uses separate fields for street, city and state to get precise results
 */
export async function geocodeAddress(address: string, city?: string, state?: string): Promise<GeocodingResult | null> {
  try {
    // Strategy 1: Structured search (most precise - city and state as separate params)
    if (city && state) {
      const normalizedCity =
        city === "Ciudad Autónoma de Buenos Aires" || city === "Capital" ? "Buenos Aires" : city

      const params = new URLSearchParams({
        street: address,
        city: normalizedCity,
        state: state,
        country: "Argentina",
        format: "json",
        limit: "5",
        addressdetails: "1",
      })
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`

      const response = await fetch(url, {
        headers: { "User-Agent": "Real Estate Management App" },
      })

      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          // Filter results to those that match city
          const filtered = data.filter((r: any) => {
            const addr = r.address || {}
            const resultCity = (addr.city || addr.town || addr.municipality || "").toLowerCase()
            return resultCity.includes(normalizedCity.toLowerCase())
          })
          const best = filtered.length > 0 ? filtered[0] : data[0]
          return {
            latitude: Number.parseFloat(best.lat),
            longitude: Number.parseFloat(best.lon),
            displayName: best.display_name,
          }
        }
      }
    }

    // Strategy 2: Free-text search with city+state embedded in the query
    if (city && state) {
      const normalizedCity =
        city === "Ciudad Autónoma de Buenos Aires" || city === "Capital" ? "Buenos Aires" : city
      const q = `${address}, ${normalizedCity}, ${state}, Argentina`
      const params = new URLSearchParams({
        q,
        format: "json",
        limit: "10",
        countrycodes: "ar",
        addressdetails: "1",
      })
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`

      const response = await fetch(url, {
        headers: { "User-Agent": "Real Estate Management App" },
      })

      if (response.ok) {
        const data = await response.json()
        if (data && data.length > 0) {
          // Filter strictly by city match
          const filtered = data.filter((r: any) => {
            const addr = r.address || {}
            const resultCity = (addr.city || addr.town || addr.municipality || "").toLowerCase()
            return resultCity.includes(normalizedCity.toLowerCase())
          })
          const best = filtered.length > 0 ? filtered[0] : null
          if (best) {
            return {
              latitude: Number.parseFloat(best.lat),
              longitude: Number.parseFloat(best.lon),
              displayName: best.display_name,
            }
          }
        }
      }
    }

    // Strategy 3: Fallback - free-text only (least precise)
    const encodedAddress = encodeURIComponent(address)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=ar&addressdetails=1`
    const response = await fetch(url, {
      headers: { "User-Agent": "Real Estate Management App" },
    })
    if (!response.ok) return null
    const data = await response.json()
    if (!data || data.length === 0) return null
    return {
      latitude: Number.parseFloat(data[0].lat),
      longitude: Number.parseFloat(data[0].lon),
      displayName: data[0].display_name,
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
  const normalizedCity = city === "Ciudad Autónoma de Buenos Aires" ? "Buenos Aires" : city

  const correctedAddress = correctStreetName(address)
  const expandedAddress = expandAbbreviations(correctedAddress)

  // Strategy 1: structured search with corrected/expanded address
  const result1 = await geocodeAddress(expandedAddress, normalizedCity, state)
  if (result1) return result1

  await new Promise((resolve) => setTimeout(resolve, 500))

  // Strategy 2: try with original address (in case corrections broke something)
  if (address !== expandedAddress) {
    const result2 = await geocodeAddress(address, normalizedCity, state)
    if (result2) return result2
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Strategy 3: street name only (no house number) with city+state
  const streetOnly = expandedAddress.replace(/\s+\d+.*$/, "").trim()
  if (streetOnly !== expandedAddress) {
    const result3 = await geocodeAddress(streetOnly, normalizedCity, state)
    if (result3) return result3
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.error("All geocoding strategies failed for:", address, normalizedCity, state)
  return null
}
