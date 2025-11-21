import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import sharp from "sharp"

interface ImageSizes {
  thumbnail: { url: string; width: number; height: number }
  medium: { url: string; width: number; height: number }
  large: { url: string; width: number; height: number }
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

    console.log(
      `[v0] Processing image: ${file.name} (${metadata.width}x${metadata.height}) - ${isVertical ? "Vertical" : "Horizontal"}`,
    )

    // Para imágenes verticales (edificios), ajustamos las proporciones
    const sizes = isVertical
      ? {
          thumbnail: { width: 300, height: 400 }, // 3:4 para vertical
          medium: { width: 600, height: 800 }, // 3:4 para vertical
          large: { width: 1080, height: 1920 }, // 9:16 para vertical
        }
      : {
          thumbnail: { width: 400, height: 300 }, // 4:3 para horizontal
          medium: { width: 800, height: 600 }, // 4:3 para horizontal
          large: { width: 1920, height: 1080 }, // 16:9 para horizontal
        }

    const baseFileName = file.name.replace(/\.[^/.]+$/, "")
    const uploadedSizes: ImageSizes = {} as ImageSizes

    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      // Optimizar imagen con Sharp
      const optimizedBuffer = await sharp(buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: "cover", // Recorta para mantener proporción
          position: "centre",
        })
        .jpeg({
          quality: sizeName === "thumbnail" ? 70 : sizeName === "medium" ? 80 : 85,
          progressive: true,
        })
        .toBuffer()

      // Subir a Vercel Blob
      const blob = await put(`${baseFileName}-${sizeName}.jpg`, optimizedBuffer, {
        access: "public",
        addRandomSuffix: true,
        token,
        contentType: "image/jpeg",
      })

      uploadedSizes[sizeName as keyof ImageSizes] = {
        url: blob.url,
        width: dimensions.width,
        height: dimensions.height,
      }

      console.log(`[v0] Uploaded ${sizeName}: ${blob.url}`)
    }

    const result: OptimizedImage = {
      url: uploadedSizes.large.url, // URL principal es la versión large
      sizes: uploadedSizes,
      originalName: file.name,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
