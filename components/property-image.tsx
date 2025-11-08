"use client"

import { useState } from "react"
import Image from "next/image"
import { Building2 } from "lucide-react"

interface PropertyImageProps {
  src: string
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

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Building2 className="h-12 w-12 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={alt}
      className={className}
      fill={fill}
      width={fill ? undefined : 800}
      height={fill ? undefined : 600}
      priority={priority}
      onError={() => setError(true)}
      onClick={onClick}
      style={{ objectFit: "cover" }}
    />
  )
}
