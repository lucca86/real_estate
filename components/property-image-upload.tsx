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

export function PropertyImageUpload({ images, onChange, maxImages = 12 }: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const uploadFiles = async (files: File[]) => {
    if (images.length + files.length > maxImages) {
      toast({
        title: "Error",
        description: `Máximo ${maxImages} imágenes permitidas`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const uploadedImages: PropertyImage[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Archivo muy grande",
            description: `${file.name} supera el límite de 10MB`,
            variant: "destructive",
          })
          continue
        }

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
          syncToWordPress: true,
          originalName: result.originalName,
        }

        uploadedImages.push(newImage)
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
                            snapshot.isDragging ? "shadow-lg" : ""
                          } ${image.isCover ? "ring-2 ring-primary" : ""}`}
                        >
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={image.sizes.medium || "/placeholder.svg"}
                              alt={image.originalName}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                            <div
                              {...provided.dragHandleProps}
                              className="absolute left-2 top-2 cursor-move rounded bg-black/50 p-1"
                            >
                              <GripVertical className="h-4 w-4 text-white" />
                            </div>

                            {image.isCover && (
                              <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                                <Star className="h-3 w-3 fill-current" />
                                Portada
                              </div>
                            )}

                            <div className="absolute inset-0 flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                onClick={() => setCoverImage(image.id)}
                                title="Marcar como portada"
                              >
                                <Star className={`h-4 w-4 ${image.isCover ? "fill-current" : ""}`} />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                onClick={() => deleteImage(image)}
                                title="Eliminar imagen"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded bg-black/50 p-2">
                              <Checkbox
                                checked={image.syncToWordPress}
                                onCheckedChange={() => toggleWordPressSync(image.id)}
                                id={`sync-${image.id}`}
                              />
                              <label htmlFor={`sync-${image.id}`} className="text-xs text-white cursor-pointer">
                                Sincronizar con WordPress
                              </label>
                            </div>
                          </div>
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
