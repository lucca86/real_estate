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
    es_property_price_formatted?: string
    es_property_features?: string
    es_property_amenities?: string
    es_property_bedrooms?: string
    es_property_bathrooms?: string
    es_property_half_baths?: string
    es_property_total_rooms?: string
    es_property_area?: string
    es_property_lot_size?: string
    es_property_floors?: string
    es_property_floor_level?: string
    es_property_year_built?: string
    es_property_year_remodeled?: string
    es_property_parking?: string
    es_property_is_open_house?: string
    es_property_price_per_sqft?: string
    es_property_address?: string
    es_property_postal_code?: string
    es_property_latitude?: string
    es_property_longitude?: string
    es_property_address_components?: string
    es_property_keywords?: string
    es_property_feature_list?: any[]
    es_property_amenity_list?: any[]
  }
}

export class WordPressAPI {
  private baseUrl: string
  private username: string
  private password: string

  constructor() {
    let baseUrl = (process.env.WORDPRESS_API_URL || "").trim().replace(/\/$/, "")
    // Ensure the URL includes /wp-json so endpoints resolve correctly
    if (baseUrl && !baseUrl.endsWith("/wp-json")) {
      baseUrl = `${baseUrl}/wp-json`
    }
    this.baseUrl = baseUrl
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
    return data
  }

  async createProperty(property: any): Promise<{ id: number; url: string }> {
    const data = await this.request("/estatik-bridge/v1/properties", {
      method: "POST",
      body: JSON.stringify(property),
    })

    // If link is not in response, fetch it from the post endpoint
    let url = data.link || ""
    if (!url && data.post_id) {
      try {
        const postData = await this.request(`/wp/v2/properties/${data.post_id}`)
        url = postData.link || ""
      } catch {
        // Could not fetch post URL — non-fatal
      }
    }

    return { id: data.post_id, url }
  }

  async updateProperty(wordpressId: number, property: any): Promise<void> {
    try {
      // Try PUT first
      await this.request(`/estatik-bridge/v1/properties/${wordpressId}`, {
        method: "PUT",
        body: JSON.stringify(property),
      })
    } catch (putError) {
      if (putError instanceof Error && putError.message.includes("404")) {
        // Some servers block PUT — retry using POST with X-HTTP-Method-Override
        try {
          await this.request(`/estatik-bridge/v1/properties/${wordpressId}`, {
            method: "POST",
            headers: { "X-HTTP-Method-Override": "PUT" },
            body: JSON.stringify(property),
          })
        } catch (postError) {
          if (postError instanceof Error && postError.message.includes("404")) {
            throw new Error("PROPERTY_NOT_FOUND")
          }
          throw postError
        }
      } else {
        throw putError
      }
    }
  }

  async deleteProperty(wordpressId: number): Promise<void> {
    await this.request(`/estatik-bridge/v1/properties/${wordpressId}`, {
      method: "DELETE",
    })
  }

  async syncProperty(
    property: any,
  ): Promise<{ id: number; url: string; updatedImages?: any[]; imagesWereUpdated?: boolean }> {
    const payload: any = {
      title: property.title,
      content: property.description || "",
      status: property.published ? "publish" : "draft",
      sticky: property.propertyLabel === "DESTACADA" || false,
      taxonomies: {},
      meta: {},
    }

    if (property.propertyType) {
      const typeName =
        typeof property.propertyType === "string"
          ? property.propertyType
          : property.propertyType?.name || String(property.propertyType)

      payload.taxonomies.es_type = [typeName]
    }

    if (property.transactionType) {
      const categoryId =
        WORDPRESS_TAXONOMY_MAP.transactionType[
          property.transactionType as keyof typeof WORDPRESS_TAXONOMY_MAP.transactionType
        ]
      if (categoryId) {
        payload.taxonomies.es_category = [categoryId]
      }
    }

    if (property.status) {
      const statusId = WORDPRESS_TAXONOMY_MAP.status[property.status as keyof typeof WORDPRESS_TAXONOMY_MAP.status]
      if (statusId) {
        payload.taxonomies.es_status = [statusId]
      }
    }

    if (property.features && Array.isArray(property.features) && property.features.length > 0) {
      const cleanFeatures = property.features.filter((f: any) => f && String(f).trim() !== "")
      if (cleanFeatures.length > 0) {
        // As taxonomy (for filtering/search)
        payload.taxonomies.es_feature = cleanFeatures.map((f: any) => String(f).trim())
        // As meta field (for theme display)
        payload.meta.es_property_features = cleanFeatures.join(", ")
        // Also add as a serialized array meta (some themes expect this)
        payload.meta.es_property_feature_list = cleanFeatures
      }
    }

    if (property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0) {
      const cleanAmenities = property.amenities.filter((a: any) => a && String(a).trim() !== "")
      if (cleanAmenities.length > 0) {
        // As taxonomy (for filtering/search)
        payload.taxonomies.es_amenity = cleanAmenities.map((a: any) => String(a).trim())
        // As meta field (for theme display)
        payload.meta.es_property_amenities = cleanAmenities.join(", ")
        // Also add as a serialized array meta (some themes expect this)
        payload.meta.es_property_amenity_list = cleanAmenities
      }
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
      }
    }

    // Track whether any image got a new wordpressMediaId so we can persist back
    const updatedImages: any[] = []
    let imagesWereUpdated = false

    if (property.images && property.images.length > 0) {
      const imageIds: number[] = []

      for (let i = 0; i < property.images.length; i++) {
        let imageObj = property.images[i]

        // If the image is a JSON string, parse it first
        if (typeof imageObj === "string") {
          try {
            imageObj = JSON.parse(imageObj)
          } catch {
            // If it fails to parse, assume it's already a plain URL string
          }
        }

        // Prefer the dedicated 'wordpress' size (1200x900 WebP), fall back to large or root url
        const imageUrl =
          typeof imageObj === "string"
            ? imageObj
            : (imageObj?.sizes?.wordpress?.url ||
               imageObj?.sizes?.wordpress ||
               imageObj?.sizes?.large?.url ||
               imageObj?.sizes?.large ||
               imageObj?.url)

        if (!imageUrl || typeof imageUrl !== "string") {
          updatedImages.push(imageObj)
          continue
        }

        // Use a stable filename based on property id + index (no Date.now → no duplicate uploads)
        const ext = imageUrl.includes(".webp") ? "webp" : "jpg"
        const filename = `property-${property.id}-${i + 1}.${ext}`

        // Pass existing media ID so we can skip re-upload if the image hasn't changed
        const existingMediaId =
          typeof imageObj === "object" ? imageObj?.wordpressMediaId : undefined

        try {
          const imageId = await this.uploadImage(imageUrl, filename, existingMediaId)
          if (imageId) {
            imageIds.push(imageId)
            // Persist the new media ID back on the object if it changed
            if (typeof imageObj === "object" && imageId !== existingMediaId) {
              imageObj = { ...imageObj, wordpressMediaId: imageId }
              imagesWereUpdated = true
            }
          }
        } catch {
          // Non-fatal image upload error
        }

        updatedImages.push(imageObj)
      }

      if (imageIds.length > 0) {
        payload.meta._thumbnail_id = String(imageIds[0])
        payload.meta.es_property_gallery = imageIds.map((id) => String(id))
      }
    }

    if (property.price) payload.meta.es_property_price = String(property.price)
    if (property.currency) {
      const currencyMap: Record<string, string> = {
        USD: "USD",
        ARS: "ARS",
      }

      const mappedCurrency = currencyMap[property.currency] || "USD"
      payload.meta.es_property_price_currency = mappedCurrency

      const currencySymbols: Record<string, { symbol: string; format: (price: number) => string }> = {
        USD: {
          symbol: "USD",
          format: (price: number) => `USD ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
        },
        ARS: {
          symbol: "Pesos",
          format: (price: number) => `Pesos ${price.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`,
        },
      }

      const currencyInfo = currencySymbols[mappedCurrency] || currencySymbols.USD
      const formattedPrice = currencyInfo.format(property.price || 0)
      payload.meta.es_property_price_formatted = formattedPrice


    }
    if (property.bedrooms) payload.meta.es_property_bedrooms = String(property.bedrooms)
    if (property.bathrooms) payload.meta.es_property_bathrooms = String(property.bathrooms)
    if (property.halfBathrooms) payload.meta.es_property_half_baths = String(property.halfBathrooms)
    if (property.totalRooms) payload.meta.es_property_total_rooms = String(property.totalRooms)
    if (property.area) payload.meta.es_property_area = String(property.area)
    if (property.lotSize) payload.meta.es_property_lot_size = String(property.lotSize)
    if (property.floors) payload.meta.es_property_floors = String(property.floors)
    if (property.floorLevel) payload.meta.es_property_floor_level = String(property.floorLevel)

    const isLand = property.propertyType?.toLowerCase().includes("terreno")
    if (property.yearBuilt && property.yearBuilt > 0) {
      payload.meta.es_property_year_built = String(property.yearBuilt)
    }

    if (property.yearRemodeled) payload.meta.es_property_year_remodeled = String(property.yearRemodeled)
    if (property.parkingSpaces) payload.meta.es_property_parking = String(property.parkingSpaces)

    if (property.openHouse !== undefined) {
      payload.meta.es_property_is_open_house = property.openHouse ? "1" : "0"
    }

    if (property.pricePerM2) {
      const pricePerSqft = property.pricePerM2 / 10.764
      payload.meta.es_property_price_per_sqft = String(Math.round(pricePerSqft))
    }

    const extractName = (value: any): string | undefined => {
      if (!value) return undefined
      if (typeof value === "string") return value
      if (typeof value === "object" && value.name) return value.name
      return String(value)
    }

    const addressParts = [
      property.address,
      extractName(property.city),
      extractName(property.province) || extractName(property.state),
      extractName(property.country),
    ].filter(Boolean)

    if (addressParts.length > 0) {
      payload.meta.es_property_address = addressParts.join(", ")
    }

    if (property.zipCode) payload.meta.es_property_postal_code = String(property.zipCode)

    // --- Location fields (WP field names from Estatik listing fields) ---
    // These fields appear as separate meta keys, NOT embedded in es_property_address only.
    // Field names confirmed from WP: country, province, city, es_neighborhood, postal_code

    const countryName = extractName(property.country)
    const provinceName = extractName(property.province) || extractName(property.state)
    const cityName = extractName(property.city)
    const neighborhoodName = extractName(property.neighborhood)

    if (countryName) {
      payload.meta.country = countryName
      // Also map to the standard Estatik meta key
      payload.meta.es_country = countryName
    }

    if (provinceName) {
      payload.meta.province = provinceName
      payload.meta.es_state = provinceName
    }

    if (cityName) {
      payload.meta.city = cityName
      payload.meta.es_city = cityName
    }

    if (neighborhoodName) {
      payload.meta.es_neighborhood = neighborhoodName
    }

    // postal_code as a direct meta key (WP uses both this and es_property_postal_code)
    if (property.zipCode) {
      payload.meta.postal_code = String(property.zipCode)
    }

    let latitude = property.latitude
    let longitude = property.longitude

    if (!latitude || !longitude) {
      const addressParts = [property.address, property.city, property.state, property.country].filter(Boolean)
      if (addressParts.length > 0) {
        const fullAddress = addressParts.join(", ")
        try {
          const { geocodeAddress } = await import("./geocoding")
          const coords = await geocodeAddress(fullAddress)
          if (coords) {
            latitude = coords.latitude
            longitude = coords.longitude
          }
        } catch {
          // Geocoding failed — non-fatal
        }
      }
    }

    if (latitude) {
      payload.meta.es_property_latitude = String(Number(latitude).toFixed(7))
    }
    if (longitude) {
      payload.meta.es_property_longitude = String(Number(longitude).toFixed(7))
    }

    const addressComponents = property.address?.components
      ? property.address.components
          .filter((c: any) => c.types && c.types.length > 0)
          .map((c: any) => ({
            long_name: c.long_name,
            types: c.types.slice(0, 2), // Only first 2 types to reduce size
          }))
      : []

    const addressComponentsJson = JSON.stringify(addressComponents)
    if (addressComponentsJson.length < 500) {
      payload.meta.es_property_address_components = addressComponentsJson
    }

    const keywords = [property.title]
    if (addressParts.length > 0) {
      keywords.push(addressParts.join(", "))
    }
    if (property.id) {
      keywords.push(String(property.id))
    }
    payload.meta.es_property_keywords = keywords.join(", ")

    // Check for existing WordPress ID (try both property names for compatibility)
    const existingId = property.wordpress_id || property.wordpressId
    
    const imagesMeta = imagesWereUpdated ? { updatedImages, imagesWereUpdated: true } : {}

    if (existingId && Number(existingId) > 0) {
      try {
        await this.updateProperty(existingId, payload)
        // Get the post URL after update
        const postData = await this.request(`/wp/v2/properties/${existingId}`)
        const url = postData.link || ""
        return { id: existingId, url, ...imagesMeta }
      } catch (error) {
        if (error instanceof Error && error.message === "PROPERTY_NOT_FOUND") {
          const result = await this.createProperty(payload)
          return { ...result, ...imagesMeta }
        }
        throw new Error(
          error instanceof Error && error.message.includes("create_failed")
            ? `Error de WordPress: ${error.message}. Verifica que todas las taxonomías (tipo, categoría, estado) existan en WordPress.`
            : error instanceof Error
              ? error.message
              : "Error desconocido al sincronizar con WordPress",
        )
      }
    } else {
      try {
        const result = await this.createProperty(payload)
        return { ...result, ...imagesMeta }
      } catch (error) {
        throw new Error(
          error instanceof Error && error.message.includes("create_failed")
            ? `Error de WordPress: ${error.message}. Verifica que todas las taxonomías (tipo, categoría, estado) existan en WordPress.`
            : error instanceof Error
              ? error.message
              : "Error desconocido al crear la propiedad en WordPress",
        )
      }
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
    const data = await this.request(`/estatik-bridge/v1/properties/${wordpressId}/debug`)
    return data
  }

  async uploadImage(
    imageUrl: string,
    filename: string,
    existingMediaId?: number,
  ): Promise<number | undefined> {
    try {
      // If we already have a media ID, verify it still exists in WP before re-uploading
      if (existingMediaId && existingMediaId > 0) {
        try {
          await this.request(`/wp/v2/media/${existingMediaId}`)
          // Media still exists — reuse without uploading anything
          return existingMediaId
        } catch {
          // Media was deleted from WP — fall through to re-upload
        }
      }

      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) return undefined

      const imageBuffer = await imageResponse.arrayBuffer()
      if (imageBuffer.byteLength === 0) return undefined

      const imageBlob = new Blob([imageBuffer])
      const formData = new FormData()
      formData.append("file", imageBlob, filename)

      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64")
      const uploadResponse = await fetch(`${this.baseUrl}/wp/v2/media`, {
        method: "POST",
        headers: { Authorization: `Basic ${credentials}` },
        body: formData,
      })

      if (!uploadResponse.ok) return undefined

      const mediaData = await uploadResponse.json()
      return mediaData.id
    } catch {
      return undefined
    }
  }
}

const WORDPRESS_TAXONOMY_MAP = {
  transactionType: {
    VENTA: 2,
    ALQUILER: 3,
    VENTA_ALQUILER: 177,
    ALQUILER_OPCION_COMPRA: 3,
  },
  status: {
    ACTIVO: 10,
    ALQUILADO: 11,
    VENDIDO: 12,
    ELIMINADO: 13,
    RESERVADO: 14,
    EN_REVISION: 15,
  },
}

export const wordpressAPI = new WordPressAPI()
export const wordpressClient = wordpressAPI
export type { WordPressProperty }
