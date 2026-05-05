import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import sharp from "sharp"

interface ImageSizeEntry {
  url: string
  width: number
  height: number
}

interface ImageSizes {
  thumbnail: ImageSizeEntry
  medium: ImageSizeEntry
  large: ImageSizeEntry
  wordpress: ImageSizeEntry
}

interface OptimizedImage {
  url: string
  sizes: ImageSizes
  originalName: string
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN not configured in environment variables" },
        { status: 500 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const metadata = await sharp(buffer).metadata()
    const isVertical = (metadata.height || 0) > (metadata.width || 0)

    // Optimal dimensions per size:
    // - thumbnail: grids, cards, listings
    // - medium:    main gallery view, internal detail
    // - large:     fullscreen / lightbox
    // - wordpress: dedicated size for WP sync (1200x900 WebP ~110KB)
    const sizes = isVertical
      ? {
          thumbnail:  { width: 360,  height: 480  }, // 3:4
          medium:     { width: 768,  height: 1024 }, // 3:4
          large:      { width: 1080, height: 1440 }, // 3:4
          wordpress:  { width: 900,  height: 1200 }, // 3:4 — WP dedicated
        }
      : {
          thumbnail:  { width: 480,  height: 360  }, // 4:3
          medium:     { width: 1024, height: 768  }, // 4:3
          large:      { width: 1440, height: 1080 }, // 4:3  (was 1920x1080)
          wordpress:  { width: 1200, height: 900  }, // 4:3 — WP dedicated
        }

    // WebP quality per size
    const qualities: Record<string, number> = {
      thumbnail: 75,
      medium:    82,
      large:     85,
      wordpress: 80,
    }

    const baseFileName = file.name.replace(/\.[^/.]+$/, "")
    const uploadedSizes: Partial<ImageSizes> = {}

    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      const optimizedBuffer = await sharp(buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: "cover",
          position: "centre",
          withoutEnlargement: true, // never upscale smaller originals
        })
        .webp({
          quality: qualities[sizeName],
          effort: 4, // 0=fast…6=best — 4 is the best balance for serverless
        })
        .toBuffer()

      const blob = await put(`${baseFileName}-${sizeName}.webp`, optimizedBuffer, {
        access: "public",
        addRandomSuffix: true,
        token,
        contentType: "image/webp",
      })

      uploadedSizes[sizeName as keyof ImageSizes] = {
        url: blob.url,
        width: dimensions.width,
        height: dimensions.height,
      }
    }

    const result: OptimizedImage = {
      url: uploadedSizes.large!.url, // primary URL is the large version
      sizes: uploadedSizes as ImageSizes,
      originalName: file.name,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
