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
  isVertical: boolean
}

// ALL output canvases are 4:3 (width × height). Vertical images are scaled to
// fit inside the canvas height and padded with white on both sides.
// This guarantees a uniform aspect ratio across the entire gallery.
const SIZES = {
  thumbnail: { width: 480,  height: 360  },
  medium:    { width: 1024, height: 768  },
  large:     { width: 1440, height: 1080 },
  wordpress: { width: 1200, height: 900  },
} as const

const QUALITIES: Record<keyof typeof SIZES, number> = {
  thumbnail: 75,
  medium:    82,
  large:     85,
  wordpress: 80,
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
    const isVertical = (metadata.height ?? 0) > (metadata.width ?? 0)

    const baseFileName = file.name.replace(/\.[^/.]+$/, "")
    const uploadedSizes: Partial<ImageSizes> = {}

    for (const [sizeName, canvas] of Object.entries(SIZES) as [keyof typeof SIZES, { width: number; height: number }][]) {
      // Step 1 — flatten any transparency onto white (needed before extend/contain)
      // Step 2 — resize with `contain` so the full image fits inside the canvas
      //           while preserving aspect ratio; Sharp fills the remainder with white
      // Step 3 — encode as WebP
      //
      // Using `contain` for ALL images (not just verticals) ensures consistent
      // output: horizontals that already match 4:3 fill the canvas completely,
      // while verticals end up centred with white letterbox padding on the sides.
      const optimizedBuffer = await sharp(buffer)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .resize(canvas.width, canvas.height, {
          fit: "contain",
          position: "centre",
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255 },
        })
        .webp({ quality: QUALITIES[sizeName], effort: 4 })
        .toBuffer()

      const blob = await put(
        `${baseFileName}-${sizeName}.webp`,
        optimizedBuffer,
        {
          access: "public",
          addRandomSuffix: true,
          token,
          contentType: "image/webp",
        },
      )

      uploadedSizes[sizeName] = {
        url: blob.url,
        width: canvas.width,
        height: canvas.height,
      }
    }

    const result: OptimizedImage = {
      url: uploadedSizes.large!.url,
      sizes: uploadedSizes as ImageSizes,
      originalName: file.name,
      isVertical,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
