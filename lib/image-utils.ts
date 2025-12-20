export interface PropertyImage {
  id?: string
  url: string
  sizes?: {
    thumbnail?: string
    medium?: string
    large?: string
    full?: string
  }
  isCover?: boolean
  syncToWordPress?: boolean
  originalName?: string
}

export function normalizeImageUrl(image: string | PropertyImage | any): string {
  // Base case: if it's already a valid HTTP URL string, return it
  if (typeof image === "string" && image.startsWith("http")) {
    return image
  }

  // If it's a string that might be JSON, try to parse it
  if (typeof image === "string") {
    try {
      const parsed = JSON.parse(image)
      // Recursively process the parsed object
      return normalizeImageUrl(parsed)
    } catch {
      return ""
    }
  }

  // If it's an object, extract the URL
  if (image && typeof image === "object") {
    // Try url property first
    if (image.url) {
      // If url is a string starting with http, return it
      if (typeof image.url === "string" && image.url.startsWith("http")) {
        return image.url
      }
      // If url is a nested object or JSON string, recursively process it
      if (typeof image.url === "string" || typeof image.url === "object") {
        const extracted = normalizeImageUrl(image.url)
        if (extracted) {
          return extracted
        }
      }
    }

    // Try sizes properties
    if (image.sizes) {
      if (image.sizes.large && typeof image.sizes.large === "string" && image.sizes.large.startsWith("http")) {
        return image.sizes.large
      }
      if (image.sizes.medium && typeof image.sizes.medium === "string" && image.sizes.medium.startsWith("http")) {
        return image.sizes.medium
      }
      if (
        image.sizes.thumbnail &&
        typeof image.sizes.thumbnail === "string" &&
        image.sizes.thumbnail.startsWith("http")
      ) {
        return image.sizes.thumbnail
      }
    }
  }

  return ""
}

export function normalizeImages(images: (string | PropertyImage)[]): PropertyImage[] {
  return images.map((img, index) => {
    if (typeof img === "string") {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(img)
        if (parsed && typeof parsed === "object" && parsed.url) {
          return parsed as PropertyImage
        }
      } catch {
        // If not JSON, treat as simple URL
        return {
          id: `img-${index}`,
          url: img,
          sizes: {
            thumbnail: img,
            medium: img,
            large: img,
            full: img,
          },
          isCover: index === 0,
          syncToWordPress: true,
        }
      }
    }
    return img as PropertyImage
  })
}

export function getCoverImageUrl(images: (string | PropertyImage)[]): string {
  if (!images || images.length === 0) return ""

  // Find cover image
  const coverImage = images.find((img) => {
    if (typeof img === "string") {
      try {
        const parsed = JSON.parse(img)
        return parsed.isCover === true
      } catch {
        return false
      }
    }
    return img.isCover === true
  })

  if (coverImage) {
    return normalizeImageUrl(coverImage)
  }

  // Return first image
  return normalizeImageUrl(images[0])
}
