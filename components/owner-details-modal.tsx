"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Mail, Phone, MapPin, Building2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Owner {
  id: string
  name: string
  email: string | null
  phone: string | null
  secondary_phone?: string | null
  first_name?: string | null
  last_name?: string | null
  owner_type?: string | null
  real_estate_agency?: string | null
  address?: string | null
  city?: { name: string } | null
  province?: { name: string } | null
  country?: { name: string } | null
  notes?: string | null
  is_active?: boolean
}

interface OwnerDetailsModalProps {
  owner: Owner
  children: React.ReactNode
}

export function OwnerDetailsModal({ owner, children }: OwnerDetailsModalProps) {
  const ownerTypeLabels = {
    Propietario: "Propietario",
    Apoderado: "Apoderado",
    Intermediario: "Intermediario",
  }

  const displayName = owner.first_name && owner.last_name ? `${owner.first_name} ${owner.last_name}` : owner.name

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles del Contacto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Name and Type */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">{displayName}</span>
              </div>
              {owner.owner_type && (
                <Badge variant="secondary">
                  {ownerTypeLabels[owner.owner_type as keyof typeof ownerTypeLabels] || owner.owner_type}
                </Badge>
              )}
            </div>
            {owner.is_active !== undefined && (
              <Badge variant={owner.is_active ? "default" : "secondary"} className="ml-7">
                {owner.is_active ? "Activo" : "Inactivo"}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            {owner.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{owner.email}</p>
                </div>
              </div>
            )}

            {owner.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Teléfono Principal</p>
                  <p className="text-sm">{owner.phone}</p>
                </div>
              </div>
            )}

            {owner.secondary_phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Teléfono Secundario</p>
                  <p className="text-sm">{owner.secondary_phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Real Estate Agency */}
          {owner.real_estate_agency && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Inmobiliaria de Referencia</p>
                  <p className="text-sm">{owner.real_estate_agency}</p>
                </div>
              </div>
            </>
          )}

          {/* Address */}
          {(owner.address || owner.city || owner.province || owner.country) && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <div className="space-y-1 text-sm">
                    {owner.address && <p>{owner.address}</p>}
                    {owner.city?.name && <p>Ciudad: {owner.city.name}</p>}
                    {owner.province?.name && <p>Provincia: {owner.province.name}</p>}
                    {owner.country?.name && <p>País: {owner.country.name}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {owner.notes && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Notas</p>
                  <p className="text-sm whitespace-pre-wrap">{owner.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
