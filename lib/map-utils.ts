/**
 * Validates if coordinates are within valid ranges
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export function isValidCoordinate(lat: number | null, lng: number | null): boolean {
  if (lat === null || lng === null) return false
  if (isNaN(lat) || isNaN(lng)) return false
  if (lat < -90 || lat > 90) return false
  if (lng < -180 || lng > 180) return false
  return true
}

/**
 * Attempts to fix common coordinate errors
 * - Missing decimal points (e.g., -27486345 -> -27.486345)
 * - Swapped lat/lng
 */
export function normalizeCoordinate(lat: number, lng: number): { lat: number; lng: number } | null {
  // Check if coordinates are already valid
  if (isValidCoordinate(lat, lng)) {
    return { lat, lng }
  }

  // Try to fix missing decimal point (common error)
  // If the number is too large, try dividing by 1000000
  let fixedLat = lat
  let fixedLng = lng

  if (Math.abs(lat) > 90) {
    // Try to fix by adding decimal point
    const latStr = Math.abs(lat).toString()
    if (latStr.length >= 8) {
      // Likely missing decimal: -27486345 -> -27.486345
      fixedLat = Number.parseFloat(`${lat < 0 ? "-" : ""}${latStr.slice(0, 2)}.${latStr.slice(2)}`)
    }
  }

  if (Math.abs(lng) > 180) {
    const lngStr = Math.abs(lng).toString()
    if (lngStr.length >= 8) {
      fixedLng = Number.parseFloat(`${lng < 0 ? "-" : ""}${lngStr.slice(0, 2)}.${lngStr.slice(2)}`)
    }
  }

  // Check if fixed coordinates are valid
  if (isValidCoordinate(fixedLat, fixedLng)) {
    console.warn(`[v0] Fixed invalid coordinates: [${lat}, ${lng}] -> [${fixedLat}, ${fixedLng}]`)
    return { lat: fixedLat, lng: fixedLng }
  }

  // Try swapping lat/lng in case they're reversed
  if (isValidCoordinate(lng, lat)) {
    console.warn(`[v0] Swapped lat/lng: [${lat}, ${lng}] -> [${lng}, ${lat}]`)
    return { lat: lng, lng: lat }
  }

  console.error(`[v0] Could not fix invalid coordinates: [${lat}, ${lng}]`)
  return null
}

/**
 * Default center for Corrientes, Argentina
 */
export const CORRIENTES_CENTER: [number, number] = [-27.4692, -58.8306]
