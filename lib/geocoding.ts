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

const NOMINATIM_HEADERS = { "User-Agent": "GestionInmobiliariaRE/1.0" }

/**
 * Score a Nominatim result against expected city and state.
 * Only uses structured address fields (city/town/municipality/state),
 * NOT displayName — which can falsely match province names embedded in any result.
 * Returns a numeric score — higher is better.
 */
function scoreResult(result: any, city?: string, state?: string): number {
  const addr = result.address || {}
  let score = 0

  if (city) {
    const normalizedCity =
      city === "Ciudad Autónoma de Buenos Aires" || city === "Capital" ? "Buenos Aires" : city.toLowerCase()

    // Nominatim returns city name in different fields depending on place type
    const resultCityRaw =
      addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county || ""
    const resultCity = resultCityRaw.toLowerCase()

    if (resultCity && (resultCity.includes(normalizedCity) || normalizedCity.includes(resultCity))) {
      score += 300 // strong match on structured city field
    } else if (resultCity) {
      score -= 400 // wrong city — discard
    }
  }

  if (state) {
    const resultState = (addr.state || "").toLowerCase()
    const stateLower = state.toLowerCase()
    if (resultState && (resultState.includes(stateLower) || stateLower.includes(resultState))) {
      score += 100
    } else if (resultState) {
      score -= 150
    }
  }

  if (addr.house_number) score += 50
  if (addr.road) score += 30
  if (result.importance) score += result.importance * 10
  if (result.type === "house" || result.type === "building" || result.type === "residential") score += 40

  return score
}

/**
 * Fetch from Nominatim and return the best-scored result for city/state.
 * Rejects results where the city clearly doesn't match (score < 0).
 */
async function fetchNominatim(url: string, city?: string, state?: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(url, { headers: NOMINATIM_HEADERS })
    if (!response.ok) return null

    const data = await response.json()
    if (!data || data.length === 0) return null

    const scored = data
      .map((r: any) => ({ ...r, _score: scoreResult(r, city, state) }))
      .sort((a: any, b: any) => b._score - a._score)

    const best = scored[0]

    // Reject if the best result has a negative score — wrong city or province
    if (best._score < 0) return null

    return {
      latitude: Number.parseFloat(best.lat),
      longitude: Number.parseFloat(best.lon),
      displayName: best.display_name,
    }
  } catch {
    return null
  }
}

/**
 * Geocode an address using Nominatim structured parameters first,
 * then falling back to a free-text query.
 */
export async function geocodeAddress(address: string, city?: string, state?: string): Promise<GeocodingResult | null> {
  const base = "https://nominatim.openstreetmap.org/search?format=json&limit=10&countrycodes=ar&addressdetails=1"

  // Strategy 1: Structured parameters (most precise)
  if (city && state) {
    const params = new URLSearchParams({
      street: address,
      city: city === "Ciudad Autónoma de Buenos Aires" ? "Buenos Aires" : city,
      state: state,
      country: "Argentina",
    })
    const structured = await fetchNominatim(`${base}&${params}`, city, state)
    if (structured) return structured
    await new Promise((r) => setTimeout(r, 500))
  }

  // Strategy 2: Free-text query with full context
  if (city && state) {
    const q = encodeURIComponent(`${address}, ${city}, ${state}, Argentina`)
    const freeText = await fetchNominatim(`${base}&q=${q}`, city, state)
    if (freeText) return freeText
    await new Promise((r) => setTimeout(r, 500))
  }

  // Strategy 3: Free-text without state
  if (city) {
    const q = encodeURIComponent(`${address}, ${city}, Argentina`)
    const freeText = await fetchNominatim(`${base}&q=${q}`, city, state)
    if (freeText) return freeText
  }

  return null
}

/**
 * Geocode a property address by combining address components.
 * Uses OpenStreetMap Nominatim structured search (street + city + state)
 * for maximum accuracy, with free-text fallbacks.
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

  // Try with the corrected/expanded address first
  const result = await geocodeAddress(expandedAddress, normalizedCity, state)
  if (result) return result

  // Fallback: try original address if it differs (e.g. the corrections changed something)
  if (expandedAddress !== address) {
    await new Promise((r) => setTimeout(r, 500))
    const fallback = await geocodeAddress(address, normalizedCity, state)
    if (fallback) return fallback
  }

  return null
}
