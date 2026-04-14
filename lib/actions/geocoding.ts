"use server"

import { geocodeProperty } from "@/lib/geocoding"

export async function geocodeAddressAction(
  address: string,
  city: string,
  state: string,
): Promise<{ latitude: number; longitude: number; displayName: string } | null> {
  if (!address || !city || !state) return null

  try {
    const result = await geocodeProperty(address, city, state)
    return result
  } catch (error) {
    console.error("[geocoding action] Error:", error)
    return null
  }
}
