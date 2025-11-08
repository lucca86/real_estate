"use server"

interface PropertyDetails {
  propertyType?: string
  transactionType?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  city?: string
  state?: string
  price?: number
  currency?: string
  features?: string[]
  amenities?: string[]
}

export async function generatePropertyTitle(details: PropertyDetails) {
  console.log("[v0] generatePropertyTitle called with:", details)

  try {
    // Template patterns for different property types
    const templates = {
      CASA: [
        "{bedrooms} Hab. en {location} - {highlight}",
        "Casa {highlight} en {location} - {bedrooms} Hab.",
        "Hermosa Casa en {location} con {bedrooms} Habitaciones",
        "{highlight} Casa de {bedrooms} Hab. en {location}",
        "Casa {area}m² en {location} - {bedrooms} Hab. {bathrooms} Baños",
      ],
      APARTAMENTO: [
        "Apartamento {highlight} en {location} - {bedrooms} Hab.",
        "{bedrooms} Hab. en {location} - Apartamento {highlight}",
        "Moderno Apartamento en {location} con {bedrooms} Hab.",
        "{highlight} Apartamento de {area}m² en {location}",
        "Apartamento {bedrooms} Hab. {bathrooms} Baños en {location}",
      ],
      TERRENO: [
        "Terreno {area}m² en {location} - {highlight}",
        "{highlight} Terreno en {location} de {area}m²",
        "Excelente Terreno en {location} - {area}m²",
        "Terreno en {location} - {area}m² {highlight}",
        "{area}m² en {location} - Terreno {highlight}",
      ],
      LOCAL_COMERCIAL: [
        "Local Comercial en {location} - {area}m²",
        "{highlight} Local en {location} de {area}m²",
        "Local Comercial {area}m² en {location}",
        "Excelente Local en {location} - {area}m² {highlight}",
        "Local {highlight} en {location} - {area}m²",
      ],
      OFICINA: [
        "Oficina {area}m² en {location} - {highlight}",
        "{highlight} Oficina en {location} de {area}m²",
        "Moderna Oficina en {location} - {area}m²",
        "Oficina en {location} {area}m² {highlight}",
        "{area}m² Oficina {highlight} en {location}",
      ],
      BODEGA: [
        "Bodega {area}m² en {location}",
        "{highlight} Bodega de {area}m² en {location}",
        "Bodega en {location} - {area}m² {highlight}",
        "Excelente Bodega en {location} de {area}m²",
        "{area}m² Bodega en {location} - {highlight}",
      ],
    }

    // Get location string
    const location =
      details.city && details.state
        ? `${details.city}, ${details.state}`
        : details.city || details.state || "Excelente Ubicación"

    // Get highlight feature
    let highlight = ""
    if (details.features && details.features.length > 0) {
      const featureMap: Record<string, string> = {
        piscina: "con Piscina",
        jardin: "con Jardín",
        garage: "con Garage",
        balcon: "con Balcón",
        terraza: "con Terraza",
        amoblado: "Amoblado",
        seguridad: "con Seguridad",
      }

      for (const feature of details.features) {
        const key = feature.toLowerCase()
        if (featureMap[key]) {
          highlight = featureMap[key]
          break
        }
      }
    }

    if (!highlight && details.amenities && details.amenities.length > 0) {
      const amenityMap: Record<string, string> = {
        gimnasio: "con Gimnasio",
        ascensor: "con Ascensor",
        estacionamiento: "con Estacionamiento",
        "aire acondicionado": "con A/C",
        calefaccion: "con Calefacción",
      }

      for (const amenity of details.amenities) {
        const key = amenity.toLowerCase()
        if (amenityMap[key]) {
          highlight = amenityMap[key]
          break
        }
      }
    }

    // Default highlights based on transaction type
    if (!highlight) {
      if (details.transactionType === "VENTA") {
        highlight = "Impecable"
      } else if (details.transactionType === "ALQUILER") {
        highlight = "Disponible Ya"
      } else {
        highlight = "Excelente"
      }
    }

    // Get templates for property type
    const propertyType = details.propertyType || "CASA"
    const typeTemplates = templates[propertyType as keyof typeof templates] || templates.CASA

    // Select a random template
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)]

    // Replace placeholders
    let title = template
      .replace("{bedrooms}", details.bedrooms?.toString() || "3")
      .replace("{bathrooms}", details.bathrooms?.toString() || "2")
      .replace("{area}", details.area?.toString() || "100")
      .replace("{location}", location)
      .replace("{highlight}", highlight)

    // Ensure title is not too long (max 80 characters)
    if (title.length > 80) {
      // Try to shorten by removing highlight
      title = template
        .replace("{bedrooms}", details.bedrooms?.toString() || "3")
        .replace("{bathrooms}", details.bathrooms?.toString() || "2")
        .replace("{area}", details.area?.toString() || "100")
        .replace("{location}", location)
        .replace(" - {highlight}", "")
        .replace(" {highlight}", "")
        .replace("{highlight} ", "")
    }

    // If still too long, truncate
    if (title.length > 80) {
      title = title.substring(0, 77) + "..."
    }

    console.log("[v0] Generated title:", title)

    return { success: true, title }
  } catch (error) {
    console.error("[v0] Error generating property title:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al generar el título",
    }
  }
}
