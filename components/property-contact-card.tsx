"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone } from "lucide-react"
import { OwnerDetailsModal } from "@/components/owner-details-modal"

interface PropertyContactCardProps {
  owner: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
}

export function PropertyContactCard({ owner }: PropertyContactCardProps) {
  const ownerWithCompatiblePhone = {
    ...owner,
    phone: owner.phone ?? null,
  }

  return (
    <OwnerDetailsModal owner={ownerWithCompatiblePhone}>
      <Card className="cursor-pointer transition-colors hover:bg-accent">
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{owner.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a
              href={`mailto:${owner.email}`}
              className="font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {owner.email}
            </a>
          </div>
          {ownerWithCompatiblePhone.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${ownerWithCompatiblePhone.phone}`}
                className="font-medium text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {ownerWithCompatiblePhone.phone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </OwnerDetailsModal>
  )
}
