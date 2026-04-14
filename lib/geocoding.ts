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
    irogyen: "yrigoyen",
    irigoyen: "yrigoyen",
    "hipolito irogyen": "hipolito yrigoyen",
    "hipólito irogyen": "hipólito yrigoyen",
    "san martin": "san martín",
    colon: "colón",
    cordoba: "córdoba",
  }

  let corrected = street.toLowerCase()
  for (const [wrong, right] of Object.entries(corrections)) {
    corrected = corrected.replace(new RegExp(wrong, "gi"), right)
  }

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

const GEOREF_BASE = "https://apis.datos.gob.ar/georef/api"
const GEOREF_HEADERS = { "User-Agent": "GestionInmobiliariaRE/1.0" }

/**
 * Normalize city name for comparison and API calls.
 * "Capital" is the internal name used for some provincial capitals.
 */
function normalizeCity(city: string, state: string): string {
  if (city === "Capital" || city === "Ciudad Autónoma de Buenos Aires") {
    // For CABA use "Buenos Aires", for other provinces use the state name as capital
    return state === "Buenos Aires" ? "Buenos Aires" : state
  }
  return city
}

/**
 * Strategy 1 — GeoRef exact street match.
 * Queries the official Argentine geocoding API by street + province,
 * then filters results to only those matching the selected city.
 */
async function georefStreet(address: string, city: string, state: string): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      direccion: address,
      provincia: state,
      max: "20",
    })
    const response = await fetch(`${GEOREF_BASE}/direcciones?${params}`, { headers: GEOREF_HEADERS })
    if (!response.ok) return null

    const data = await response.json()
    const direcciones: any[] = data.direcciones || []
    if (direcciones.length === 0) return null

    // Filter to results whose localidad matches the selected city
    const cityLower = city.toLowerCase()
    const matched = direcciones.filter((r: any) => {
      const loc = (
        r.localidad?.nombre ||
        r.localidad_censal?.nombre ||
        ""
      ).toLowerCase()
      return loc.includes(cityLower) || cityLower.includes(loc)
    })

    const best = matched[0]
    if (!best) return null

    const ub = best.ubicacion
    if (!ub?.lat || !ub?.lon) return null

    return {
      latitude: ub.lat,
      longitude: ub.lon,
      displayName: best.nomenclatura || address,
    }
  } catch {
    return null
  }
}

/**
 * Strategy 2 — GeoRef city centroid fallback.
 * When the exact street isn't found, returns the geographic center of the city.
 * This guarantees the pin is at least in the correct city, not in a wrong one.
 */
async function georefCityCentroid(city: string, state: string): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      nombre: city,
      provincia: state,
      max: "5",
      campos: "completo",
    })
    const response = await fetch(`${GEOREF_BASE}/localidades?${params}`, { headers: GEOREF_HEADERS })
    if (!response.ok) return null

    const data = await response.json()
    const localidades: any[] = data.localidades || []
    if (localidades.length === 0) return null

    // Prefer exact name match
    const cityLower = city.toLowerCase()
    const best =
      localidades.find((l: any) => l.nombre?.toLowerCase() === cityLower) || localidades[0]

    const centroide = best.centroide
    if (!centroide?.lat || !centroide?.lon) return null

    return {
      latitude: centroide.lat,
      longitude: centroide.lon,
      displayName: `${city}, ${state}, Argentina`,
    }
  } catch {
    return null
  }
}

/**
 * Geocode an address for a given city and province.
 * Uses GeoRef (official Argentine API) for accuracy:
 *  1. Exact street search filtered by city
 *  2. City centroid fallback (correct city, approximate location)
 */
export async function geocodeAddress(address: string, city?: string, state?: string): Promise<GeocodingResult | null> {
  if (!city || !state) return null

  const normalizedCity = normalizeCity(city, state)

  // Strategy 1: exact street in the correct city
  const exact = await georefStreet(address, normalizedCity, state)
  if (exact) return exact

  // Strategy 2: city centroid — guarantees correct city even if street not found
  await new Promise((r) => setTimeout(r, 300))
  const centroid = await georefCityCentroid(normalizedCity, state)
  return centroid
}

/**
 * Geocode a property address by combining all location components.
 * Tries with corrected/expanded address first, then original as fallback.
 */
export async function geocodeProperty(
  address: string,
  city: string,
  state: string,
  country = "Argentina",
  neighborhood?: string,
): Promise<GeocodingResult | null> {
  const normalizedCity = normalizeCity(city, state)

  const correctedAddress = correctStreetName(address)
  const expandedAddress = expandAbbreviations(correctedAddress)

  const result = await geocodeAddress(expandedAddress, normalizedCity, state)
  if (result) return result

  if (expandedAddress !== address) {
    await new Promise((r) => setTimeout(r, 300))
    return geocodeAddress(address, normalizedCity, state)
  }

  return null
}
