"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Upload, X, Star, Loader2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"

interface PropertyImage {
  id: string
  url: string
  sizes: {
    thumbnail: string
    medium: string
    large: string
  }
  isCover: boolean
  syncToWordPress: boolean
  originalName: string
}

interface PropertyImageUploadProps {
  images: PropertyImage[]
  onChange: (images: PropertyImage[]) => void
  maxImages?: number
}

const getImageUrl = (image: any): string => {
  // Base case: if it's a string starting with http, it's a real URL
  if (typeof image === "string") {
    if (image.startsWith("http")) {
      return image
    }
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(image)
      return getImageUrl(parsed) // Recursive call
    } catch (e) {
      return "/placeholder.svg"
    }
  }

  // If image is an object
  if (typeof image === "object" && image !== null) {
    // Try to extract and recursively parse the url field
    if (image.url) {
      return getImageUrl(image.url) // Recursive call
    }
    // Try sizes
    if (image.sizes?.medium) {
      return getImageUrl(image.sizes.medium)
    }
    if (image.sizes?.large) {
      return getImageUrl(image.sizes.large)
    }
    if (image.sizes?.thumbnail) {
      return getImageUrl(image.sizes.thumbnail)
    }
  }

  return "/placeholder.svg"
}

export function PropertyImageUpload({ images, onChange, maxImages = 12 }: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB total

  const isImageVertical = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const isVertical = img.height > img.width
        resolve(isVertical)
      }
      img.onerror = () => resolve(false)
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadFiles = async (files: File[]) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Error",
        description: `Máximo ${maxImages} imágenes permitidas`,
        variant: "destructive",
      })
      return
    }

    const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0)
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)

    if (totalSize > MAX_TOTAL_SIZE) {
      toast({
        title: "Tamaño total excedido",
        description: `El tamaño total de las imágenes (${totalSizeMB}MB) supera el límite de 50MB`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const uploadedImages: PropertyImage[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "Archivo muy grande",
            description: `${file.name} supera el límite de 10MB`,
            variant: "destructive",
          })
          continue
        }

        const isVertical = await isImageVertical(file)

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-property-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upload failed")
        }

        const result = await response.json()

        const newImage: PropertyImage = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: result.sizes.large.url, // URL de la versión large
          sizes: {
            thumbnail: result.sizes.thumbnail.url,
            medium: result.sizes.medium.url,
            large: result.sizes.large.url,
          },
          isCover: images.length === 0 && uploadedImages.length === 0,
          syncToWordPress: !isVertical,
          originalName: result.originalName,
        }

        uploadedImages.push(newImage)

        if (isVertical) {
          toast({
            title: "Imagen vertical detectada",
            description: `${file.name} no se sincronizará con WordPress (orientación vertical)`,
            variant: "default",
          })
        }
      }

      const newImages = [...images, ...uploadedImages]

      if (!newImages.some((img) => img.isCover) && newImages.length > 0) {
        newImages[0].isCover = true
      }

      onChange(newImages)
      toast({
        title: "Éxito",
        description: `${uploadedImages.length} imagen(es) subida(s) correctamente`,
      })
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir imágenes",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

      if (files.length > 0) {
        uploadFiles(files)
      }
    },
    [images, maxImages],
  )

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items)
      const imageItems = items.filter((item) => item.type.startsWith("image/"))

      if (imageItems.length > 0) {
        const files = await Promise.all(
          imageItems.map((item) => {
            const blob = item.getAsFile()
            return blob
          }),
        )

        const validFiles = files.filter((f): f is File => f !== null)
        if (validFiles.length > 0) {
          uploadFiles(validFiles)
        }
      }
    },
    [images, maxImages],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      uploadFiles(files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const deleteImage = async (image: PropertyImage) => {
    const newImages = images.filter((img) => img.id !== image.id)

    if (image.isCover && newImages.length > 0) {
      newImages[0].isCover = true
    }

    onChange(newImages)
    toast({
      title: "Éxito",
      description: "Imagen eliminada correctamente",
    })
  }

  const setCoverImage = (imageId: string) => {
    const newImages = images.map((img) => ({
      ...img,
      isCover: img.id === imageId,
    }))
    onChange(newImages)
    toast({
      title: "Portada actualizada",
      description: "La imagen de portada ha sido cambiada",
    })
  }

  const toggleWordPressSync = (imageId: string) => {
    const newImages = images.map((img) =>
      img.id === imageId ? { ...img, syncToWordPress: !img.syncToWordPress } : img,
    )
    onChange(newImages)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newImages = Array.from(images)
    const [reorderedItem] = newImages.splice(result.source.index, 1)
    newImages.splice(result.destination.index, 0, reorderedItem)

    onChange(newImages)

    toast({
      title: "Orden actualizado",
      description: "Las imágenes han sido reordenadas",
    })
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Subiendo imágenes...</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  Arrastra imágenes aquí o{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    explora
                  </button>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  También puedes pegar (Ctrl+V) desde el portapapeles
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Máximo {maxImages} imágenes • Hasta 10MB cada una • JPG, PNG, WebP
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {images.length} de {maxImages} imágenes
            </p>
            <p className="text-xs text-muted-foreground">Arrastra para reordenar • Marca ★ para portada</p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {images.map((image, index) => (
                    <Draggable key={image.id} draggableId={image.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group relative overflow-hidden transition-shadow ${
                            snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                          } ${image.isCover ? "ring-2 ring-primary" : ""}`}
                        >
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={getImageUrl(image) || "/placeholder.svg"}
                              alt={image.originalName || "Property image"}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                            <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-auto">
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setCoverImage(image.id)
                                }}
                                title="Marcar como portada"
                                className="shadow-lg"
                              >
                                <Star className={`h-4 w-4 ${image.isCover ? "fill-current text-yellow-500" : ""}`} />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  deleteImage(image)
                                }}
                                title="Eliminar imagen"
                                className="shadow-lg"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded bg-black/70 p-2 backdrop-blur-sm pointer-events-auto">
                              <Checkbox
                                checked={image.syncToWordPress}
                                onCheckedChange={(checked) => {
                                  toggleWordPressSync(image.id)
                                }}
                                id={`sync-${image.id}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <label
                                htmlFor={`sync-${image.id}`}
                                className="text-xs text-white cursor-pointer select-none"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Sincronizar con WordPress
                              </label>
                            </div>
                          </div>

                          <div
                            {...provided.dragHandleProps}
                            className="absolute left-2 top-2 cursor-grab rounded bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing hover:bg-black/70"
                            title="Arrastra para reordenar"
                          >
                            <GripVertical className="h-5 w-5 text-white" />
                          </div>

                          {image.isCover && (
                            <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                              <Star className="h-3 w-3 fill-current" />
                              Portada
                            </div>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  )
}
