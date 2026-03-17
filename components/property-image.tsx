"use client"

import { useState } from "react"
import Image from "next/image"
import { Building2 } from "lucide-react"

interface PropertyImageProps {
  src: string | any
  alt: string
  className?: string
  fill?: boolean
  priority?: boolean
  onClick?: () => void
}

export function PropertyImage({
  src,
  alt,
  className = "",
  fill = false,
  priority = false,
  onClick,
}: PropertyImageProps) {
  const [error, setError] = useState(false)

  const imageUrl = typeof src === "string" ? src : ""

  if (!imageUrl || error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Building2 className="h-12 w-12 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={alt}
      className={className}
      fill={fill}
      width={fill ? undefined : 800}
      height={fill ? undefined : 600}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setError(true)}
      onClick={onClick}
      style={{ objectFit: "cover" }}
    />
  )
}
