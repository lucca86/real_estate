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

/**
 * Normalize city name for GeoRef queries.
 * "Capital" is the internal departamento name used for provincial capitals in GeoRef.
 */
function normalizeCity(city: string, state: string): string {
  if (city === "Capital" || city === "Ciudad Autónoma de Buenos Aires") {
    return state === "Buenos Aires" ? "Buenos Aires" : state
  }
  return city
}

/**
 * Parse street name and number from an address string like "Uruguay 355"
 */
function parseAddress(address: string): { streetName: string; number: number | null } {
  const match = address.match(/^(.+?)\s+(\d+)\s*$/)
  if (match) {
    return { streetName: match[1].trim(), number: parseInt(match[2], 10) }
  }
  return { streetName: address.trim(), number: null }
}

const GEOREF_BASE = "https://apis.datos.gob.ar/georef/api"
const GEOREF_HEADERS = { "User-Agent": "GestionInmobiliariaRE/1.0" }

/**
 * Strategy 1 — GeoRef exact address match filtered by city.
 * Uses /direcciones endpoint, then filters results to the correct localidad.
 */
async function georefExactAddress(address: string, city: string, state: string): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({ direccion: address, provincia: state, max: "20" })
    const response = await fetch(`${GEOREF_BASE}/direcciones?${params}`, { headers: GEOREF_HEADERS })
    if (!response.ok) return null

    const data = await response.json()
    const direcciones: any[] = data.direcciones || []
    if (direcciones.length === 0) return null

    const cityLower = city.toLowerCase()
    const matched = direcciones.filter((r: any) => {
      const loc = (r.localidad?.nombre || r.localidad_censal?.nombre || "").toLowerCase()
      return loc.includes(cityLower) || cityLower.includes(loc)
    })

    const best = matched[0]
    if (!best?.ubicacion?.lat || !best?.ubicacion?.lon) return null

    return {
      latitude: best.ubicacion.lat,
      longitude: best.ubicacion.lon,
      displayName: best.nomenclatura || address,
    }
  } catch {
    return null
  }
}

/**
 * Strategy 2 — GeoRef street range clamp.
 * Finds the street in the correct departamento via /calles.
 * If the requested number is outside the registered range, clamps it to the
 * nearest boundary (start or end), then uses /direcciones with that clamped number.
 * This handles cases like "Uruguay 355" when GeoRef only has data from 552 onwards.
 */
async function georefStreetClamped(
  streetName: string,
  number: number,
  city: string,
  state: string,
): Promise<GeocodingResult | null> {
  try {
    // For provincial capitals GeoRef uses departamento "Capital"
    const deptParam = city.toLowerCase() === state.toLowerCase() ? "Capital" : city

    const callesParams = new URLSearchParams({
      nombre: streetName,
      provincia: state,
      departamento: deptParam,
      max: "3",
    })

    const callesResp = await fetch(`${GEOREF_BASE}/calles?${callesParams}`, { headers: GEOREF_HEADERS })
    if (!callesResp.ok) return null

    const callesData = await callesResp.json()
    const calles: any[] = callesData.calles || []
    if (calles.length === 0) return null

    // altura is nested: { inicio: { derecha, izquierda }, fin: { derecha, izquierda } }
    const best = calles[0]
    const altInicio: number = best.altura?.inicio?.derecha ?? best.altura?.inicio?.izquierda ?? 0
    const altFin: number = best.altura?.fin?.derecha ?? best.altura?.fin?.izquierda ?? altInicio

    if (altInicio === 0 && altFin === 0) return null

    // Clamp requested number to the known range
    const clampedNumber = Math.max(altInicio, Math.min(altFin, number))

    await new Promise((r) => setTimeout(r, 300))

    // Query /direcciones with the clamped number
    const dirsParams = new URLSearchParams({
      direccion: `${streetName} ${clampedNumber}`,
      provincia: state,
      departamento: deptParam,
      max: "5",
    })

    const dirsResp = await fetch(`${GEOREF_BASE}/direcciones?${dirsParams}`, { headers: GEOREF_HEADERS })
    if (!dirsResp.ok) return null

    const dirsData = await dirsResp.json()
    const dirs: any[] = dirsData.direcciones || []
    if (dirs.length === 0) return null

    const result = dirs[0]
    const ub = result.ubicacion
    if (!ub?.lat || !ub?.lon) return null

    return {
      latitude: ub.lat,
      longitude: ub.lon,
      displayName: `${streetName} ${number}, ${city}, ${state}, Argentina`,
    }
  } catch {
    return null
  }
}

/**
 * Strategy 3 — GeoRef city centroid.
 * Last resort: returns the geographic center of the city.
 * Guarantees the pin is in the correct city, not in a wrong one.
 */
async function georefCityCentroid(city: string, state: string): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({ nombre: city, provincia: state, max: "5" })
    const response = await fetch(`${GEOREF_BASE}/localidades?${params}`, { headers: GEOREF_HEADERS })
    if (!response.ok) return null

    const data = await response.json()
    const localidades: any[] = data.localidades || []
    if (localidades.length === 0) return null

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
 * Geocode an address for a given city and province using GeoRef (official Argentine API).
 * Strategy:
 *  1. Exact address via /direcciones filtered by city
 *  2. Street geometry interpolation via /calles (handles out-of-range numbers)
 *  3. City centroid fallback
 */
export async function geocodeAddress(address: string, city?: string, state?: string): Promise<GeocodingResult | null> {
  if (!city || !state) return null

  const normalizedCity = normalizeCity(city, state)

  // Strategy 1: exact address match
  const exact = await georefExactAddress(address, normalizedCity, state)
  if (exact) return exact

  await new Promise((r) => setTimeout(r, 300))

  // Strategy 2: street range clamp — find nearest valid number on the street
  const { streetName, number } = parseAddress(address)
  if (streetName && number !== null) {
    const clamped = await georefStreetClamped(streetName, number, normalizedCity, state)
    if (clamped) return clamped
  }

  await new Promise((r) => setTimeout(r, 300))

  // Strategy 3: city centroid — always in the right city
  return georefCityCentroid(normalizedCity, state)
}

/**
 * Geocode a property using all available location data.
 * Tries corrected/expanded address first, then original as fallback.
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
