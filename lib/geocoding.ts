interface GeocodingResult {
  latitude: number
  longitude: number
  displayName: string
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
        (addressDetails.city === "Corrientes" || addressDetails.town === "Corrientes") &&
        addressDetails.state === "Corrientes" &&
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
): Promise<GeocodingResult | null> {
  // Strategy 1: Try with expanded abbreviations
  const expandedAddress = expandAbbreviations(address)
  const fullAddress = `${expandedAddress}, ${city}, ${state}, ${country}`
  console.log("[v0] Trying geocoding with expanded address:", fullAddress)

  let result = await geocodeAddress(fullAddress)
  if (result) {
    console.log("[v0] Geocoding successful with expanded address")
    return result
  }

  // Strategy 2: Try with original address
  if (expandedAddress !== address) {
    const originalFullAddress = `${address}, ${city}, ${state}, ${country}`
    console.log("[v0] Trying geocoding with original address:", originalFullAddress)
    result = await geocodeAddress(originalFullAddress)
    if (result) {
      console.log("[v0] Geocoding successful with original address")
      return result
    }
  }

  // Strategy 3: Try without street number
  const addressWithoutNumber = address.replace(/\d+/g, "").trim()
  if (addressWithoutNumber !== address) {
    const addressNoNumber = `${addressWithoutNumber}, ${city}, ${state}, ${country}`
    console.log("[v0] Trying geocoding without street number:", addressNoNumber)
    result = await geocodeAddress(addressNoNumber)
    if (result) {
      console.log("[v0] Geocoding successful without street number")
      return result
    }
  }

  // Strategy 4: Try with just city and state
  const cityStateAddress = `${city}, ${state}, ${country}`
  console.log("[v0] Trying geocoding with just city and state:", cityStateAddress)
  result = await geocodeAddress(cityStateAddress)
  if (result) {
    console.log("[v0] Geocoding successful with city and state (approximate location)")
    return result
  }

  console.error("[v0] All geocoding strategies failed for:", { address, city, state, country })
  return null
}
