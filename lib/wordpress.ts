interface WordPressProperty {
  id?: number
  title: string
  content: string
  status: "publish" | "draft"
  es_type?: number[]
  es_category?: number[]
  es_status?: number[]
  meta: {
    es_price?: number
    es_currency?: string
    bedrooms?: number
    bathrooms?: number
    half_baths?: number
    total_rooms?: number
    es_area?: number
    es_address?: string
    es_city?: string
    es_state?: string
    es_country?: string
    es_latitude?: number
    es_longitude?: number
    es_rent_period?: string
    price_per_sqft?: number
    date_added?: string
  }
}

export class WordPressAPI {
  private baseUrl: string
  private username: string
  private password: string

  constructor() {
    this.baseUrl = process.env.WORDPRESS_API_URL || ""
    this.username = process.env.WORDPRESS_USERNAME || ""
    this.password = process.env.WORDPRESS_APP_PASSWORD || ""
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error(
        "WordPress API credentials not configured. Please set WORDPRESS_API_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD in your environment variables.",
      )
    }

    const url = `${this.baseUrl}${endpoint}`
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64")

    console.log("[v0] WordPress API Request:", {
      url,
      method: options.method || "GET",
      hasBody: !!options.body,
    })

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] WordPress API Error Response:", error)
      let errorMessage = `WordPress API error: ${response.status}`

      try {
        const errorData = JSON.parse(error)
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`
        }
        if (response.status === 401) {
          errorMessage +=
            "\n\nVerifica que:\n1. El usuario de WordPress tenga rol de Editor o Administrador\n2. El Application Password sea válido\n3. La URL de la API sea correcta\n4. El plugin 'Estatik REST API Bridge' esté instalado y activado"
        }
      } catch {
        errorMessage += ` - ${error}`
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("[v0] WordPress API Response:", JSON.stringify(data, null, 2))
    return data
  }

  async createProperty(property: any): Promise<number> {
    console.log("[v0] Creating property via custom plugin:", JSON.stringify(property, null, 2))

    const data = await this.request("/estatik-bridge/v1/properties", {
      method: "POST",
      body: JSON.stringify(property),
    })

    return data.post_id
  }

  async updateProperty(wordpressId: number, property: any): Promise<void> {
    console.log("[v0] Updating property via custom plugin:", wordpressId, JSON.stringify(property, null, 2))

    try {
      await this.request(`/estatik-bridge/v1/properties/${wordpressId}`, {
        method: "PUT",
        body: JSON.stringify(property),
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        throw new Error("PROPERTY_NOT_FOUND")
      }
      throw error
    }
  }

  async deleteProperty(wordpressId: number): Promise<void> {
    await this.request(`/estatik-bridge/v1/properties/${wordpressId}`, {
      method: "DELETE",
    })
  }

  async syncProperty(property: any): Promise<number> {
    console.log("[v0] ========================================")
    console.log("[v0] STARTING PROPERTY SYNC")
    console.log("[v0] ========================================")
    console.log("[v0] Property ID:", property.id)
    console.log("[v0] WordPress ID:", property.wordpressId)
    console.log("[v0] Property Title:", property.title)
    console.log("[v0] Transaction Type:", property.transactionType)
    console.log("[v0] Status:", property.status)
    console.log("[v0] ========================================")

    const payload: any = {
      title: property.title,
      content: property.description || "",
      status: property.published ? "publish" : "draft",
      sticky: property.propertyLabel === "DESTACADA" || false,
      taxonomies: {},
      meta: {},
    }

    if (property.propertyType) {
      payload.taxonomies.es_type = [property.propertyType]
      console.log("[v0] Added es_type (by name):", property.propertyType)
    }

    if (property.transactionType) {
      const categoryId =
        WORDPRESS_TAXONOMY_MAP.transactionType[
          property.transactionType as keyof typeof WORDPRESS_TAXONOMY_MAP.transactionType
        ]
      if (categoryId) {
        payload.taxonomies.es_category = [categoryId]
        console.log("[v0] Added es_category:", { enum: property.transactionType, wordpressId: categoryId })
      } else {
        console.warn("[v0] ⚠ Unknown transactionType:", property.transactionType)
      }
    }

    if (property.status) {
      const statusId = WORDPRESS_TAXONOMY_MAP.status[property.status as keyof typeof WORDPRESS_TAXONOMY_MAP.status]
      if (statusId) {
        payload.taxonomies.es_status = [statusId]
        console.log("[v0] Added es_status:", { enum: property.status, wordpressId: statusId })
      } else {
        console.warn("[v0] ⚠ Unknown status:", property.status)
      }
    }

    if (property.features && Array.isArray(property.features) && property.features.length > 0) {
      payload.taxonomies.es_feature = property.features
      console.log("[v0] Added es_feature (by names):", property.features)
    }

    if (property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0) {
      payload.taxonomies.es_amenity = property.amenities
      console.log("[v0] Added es_amenity (by names):", property.amenities)
    }

    if (property.propertyLabel) {
      let labelSlug = ""
      switch (property.propertyLabel) {
        case "NUEVA":
          labelSlug = "new"
          break
        case "DESTACADA":
          labelSlug = "featured"
          break
        case "REBAJADA":
          labelSlug = "reduced"
          break
      }

      if (labelSlug) {
        payload.taxonomies.es_label = [labelSlug]
        console.log("[v0] Added es_label:", { enum: property.propertyLabel, slug: labelSlug })
      }
    }

    if (property.images && property.images.length > 0) {
      console.log(`[v0] Starting upload of ${property.images.length} images marked for WordPress...`)
      const imageIds: number[] = []

      for (let i = 0; i < property.images.length; i++) {
        const imageUrl = property.images[i]
        console.log(`[v0] Uploading image ${i + 1}/${property.images.length}: ${imageUrl}`)
        const filename = `property-${property.id}-${i + 1}.jpg`

        try {
          const imageId = await this.uploadImage(imageUrl, filename)

          if (imageId) {
            imageIds.push(imageId)
            console.log(`[v0] Successfully uploaded image ${i + 1}/${property.images.length} with ID: ${imageId}`)
          }
        } catch (error) {
          console.error(`[v0] Error uploading image ${i + 1}/${property.images.length}:`, error)
        }
      }

      if (imageIds.length > 0) {
        payload.meta._thumbnail_id = String(imageIds[0])
        payload.meta.es_property_gallery = imageIds.map((id) => String(id))
        console.log(`[v0] Set featured image: ${imageIds[0]}, Gallery: ${imageIds.join(",")}`)
      }
    }

    if (property.price) payload.meta.es_property_price = String(property.price)
    if (property.bedrooms) payload.meta.es_property_bedrooms = String(property.bedrooms)
    if (property.bathrooms) payload.meta.es_property_bathrooms = String(property.bathrooms)
    if (property.halfBathrooms) payload.meta.es_property_half_baths = String(property.halfBathrooms)
    if (property.totalRooms) payload.meta.es_property_total_rooms = String(property.totalRooms)
    if (property.area) payload.meta.es_property_area = String(property.area)
    if (property.lotSize) payload.meta.es_property_lot_size = String(property.lotSize)
    if (property.floors) payload.meta.es_property_floors = String(property.floors)
    if (property.floorLevel) payload.meta.es_property_floor_level = String(property.floorLevel)
    if (property.yearBuilt) payload.meta.es_property_year_built = String(property.yearBuilt)
    if (property.yearRemodeled) payload.meta.es_property_year_remodeled = String(property.yearRemodeled)
    if (property.parkingSpaces) payload.meta.es_property_parking = String(property.parkingSpaces)

    if (property.openHouse !== undefined) {
      payload.meta.es_property_is_open_house = property.openHouse ? "1" : "0"
    }

    if (property.pricePerM2) {
      const pricePerSqft = property.pricePerM2 / 10.764
      payload.meta.es_property_price_per_sqft = String(Math.round(pricePerSqft))
    }

    const addressParts = [property.address, property.city, property.state, property.country].filter(Boolean)
    if (addressParts.length > 0) {
      payload.meta.es_property_address = addressParts.join(", ")
    }

    if (property.zipCode) payload.meta.es_property_postal_code = String(property.zipCode)

    let latitude = property.latitude
    let longitude = property.longitude

    if (!latitude || !longitude) {
      const addressParts = [property.address, property.city, property.state, property.country].filter(Boolean)
      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(", ")
        console.log(`[v0] No coordinates found, attempting to geocode address: ${fullAddress}`)

        try {
          const { geocodeAddress } = await import("./geocoding")
          const coords = await geocodeAddress(fullAddress)

          if (coords) {
            latitude = coords.latitude
            longitude = coords.longitude
            console.log(`[v0] Geocoding successful: ${latitude}, ${longitude}`)
          }
        } catch (error) {
          console.error("[v0] Geocoding error:", error)
        }
      }
    }

    if (latitude) payload.meta.es_property_latitude = String(latitude)
    if (longitude) payload.meta.es_property_longitude = String(longitude)

    if (property.address || property.city || property.state || property.country || property.zipCode) {
      const addressComponents = []

      if (property.address) {
        addressComponents.push({
          long_name: property.address,
          short_name: property.address,
          types: ["street_address"],
        })
      }

      if (property.city) {
        addressComponents.push({
          long_name: property.city,
          short_name: property.city,
          types: ["locality", "political"],
        })
      }

      if (property.state) {
        addressComponents.push({
          long_name: property.state,
          short_name: property.state,
          types: ["administrative_area_level_1", "political"],
        })
      }

      if (property.country) {
        addressComponents.push({
          long_name: property.country,
          short_name: property.country,
          types: ["country", "political"],
        })
      }

      if (property.zipCode) {
        addressComponents.push({
          long_name: property.zipCode,
          short_name: property.zipCode,
          types: ["postal_code"],
        })
      }

      payload.meta.es_property_address_components = JSON.stringify(addressComponents)
    }

    const keywords = [property.title]
    if (addressParts.length > 0) {
      keywords.push(addressParts.join(", "))
    }
    if (property.id) {
      keywords.push(String(property.id))
    }
    payload.meta.es_property_keywords = keywords.join(", ")

    console.log("[v0] Final payload:", JSON.stringify(payload, null, 2))

    if (property.wordpressId) {
      console.log("[v0] Updating existing WordPress property:", property.wordpressId)
      try {
        await this.updateProperty(property.wordpressId, payload)
        console.log("[v0] ✓ Property updated successfully")
        return property.wordpressId
      } catch (error) {
        if (error instanceof Error && error.message === "PROPERTY_NOT_FOUND") {
          console.log("[v0] ⚠ Property not found (404), creating new one...")
          const newId = await this.createProperty(payload)
          console.log("[v0] ✓ New property created with ID:", newId)
          return newId
        }
        throw error
      }
    } else {
      console.log("[v0] Creating new WordPress property")
      const newId = await this.createProperty(payload)
      console.log("[v0] ✓ Property created with ID:", newId)
      return newId
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const user = await this.request("/wp/v2/users/me")

      try {
        await this.request("/wp/v2/properties?per_page=1")
      } catch (error) {
        return {
          success: false,
          message:
            "Conexión exitosa, pero no se puede acceder al endpoint de propiedades. Verifica que el plugin Major Estatik esté instalado y activado.",
        }
      }

      const rolesText = user.roles && Array.isArray(user.roles) ? user.roles.join(", ") : "Usuario"

      return {
        success: true,
        message: `Conectado exitosamente como ${user.name} (${rolesText}). Endpoint de propiedades accesible.`,
        user,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido al conectar con WordPress",
      }
    }
  }

  async debugProperty(wordpressId: number): Promise<any> {
    console.log(`[v0] Debugging property ${wordpressId}...`)
    const data = await this.request(`/estatik-bridge/v1/properties/${wordpressId}/debug`)
    console.log("[v0] Property debug data:", JSON.stringify(data, null, 2))
    return data
  }

  async uploadImage(imageUrl: string, filename: string): Promise<number | undefined> {
    try {
      console.log(`[v0] Downloading image from: ${imageUrl}`)

      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        console.error(`[v0] Failed to download image: ${imageUrl}, status: ${imageResponse.status}`)
        return undefined
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      console.log(`[v0] Downloaded image, size: ${imageBuffer.byteLength} bytes`)

      const imageBlob = new Blob([imageBuffer])

      const formData = new FormData()
      formData.append("file", imageBlob, filename)

      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64")

      console.log(`[v0] Uploading to WordPress Media Library: ${filename}`)
      const uploadResponse = await fetch(`${this.baseUrl}/wp/v2/media`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text()
        console.error(`[v0] Failed to upload image to WordPress:`, {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error,
        })
        return undefined
      }

      const mediaData = await uploadResponse.json()
      console.log(`[v0] Image uploaded successfully:`, {
        id: mediaData.id,
        url: mediaData.source_url,
      })
      return mediaData.id
    } catch (error) {
      console.error(`[v0] Error uploading image:`, error)
      return undefined
    }
  }
}

const WORDPRESS_TAXONOMY_MAP = {
  // Transaction Types (es_category)
  transactionType: {
    VENTA: 2,
    ALQUILER: 3,
    VENTA_ALQUILER: 177, // Parent category
    ALQUILER_OPCION_COMPRA: 3, // Use Alquiler for now
  },
  // Property Status (es_status)
  status: {
    ACTIVO: 10, // Available/Active
    ALQUILADO: 11, // Rented
    VENDIDO: 12, // Sold
    ELIMINADO: 13, // Deleted
    RESERVADO: 14, // Reserved
    EN_REVISION: 15, // Under Review
  },
}

export const wordpressAPI = new WordPressAPI()
export const wordpressClient = wordpressAPI
export type { WordPressProperty }
