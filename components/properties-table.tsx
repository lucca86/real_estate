import { prisma } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Edit, MapPin, Plus } from "lucide-react"
import Link from "next/link"
import { DeletePropertyButton } from "@/components/delete-property-button"
import type { SessionUser } from "@/lib/auth"

interface PropertiesTableProps {
  currentUser: SessionUser
}

export async function PropertiesTable({ currentUser }: PropertiesTableProps) {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
      propertyType: {
        select: {
          name: true,
        },
      },
      city: {
        select: {
          name: true,
        },
      },
      province: {
        select: {
          name: true,
        },
      },
    },
  })

  const statusColors = {
    ACTIVO: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    RESERVADO: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    VENDIDO: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    ALQUILADO: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    ELIMINADO: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    EN_REVISION: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  }

  const statusLabels = {
    ACTIVO: "Activo",
    RESERVADO: "Reservado",
    VENDIDO: "Vendido",
    ALQUILADO: "Alquilado",
    ELIMINADO: "Eliminado",
    EN_REVISION: "En Revisión",
  }

  return (
    <Card>
      <CardContent className="p-6">
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No hay propiedades</h3>
            <p className="mt-2 text-sm text-muted-foreground">Comienza agregando tu primera propiedad</p>
            <Button asChild className="mt-4">
              <Link href="/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Propiedad
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="group relative overflow-hidden rounded-lg border border-border transition-all hover:shadow-lg"
              >
                <Link href={`/properties/${property.id}`}>
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    {property.images[0] ? (
                      <img
                        src={property.images[0] || "/placeholder.svg"}
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Link href={`/properties/${property.id}`} className="flex-1">
                      <h3 className="font-semibold leading-tight text-balance hover:text-primary">{property.title}</h3>
                    </Link>
                    <Badge variant="secondary" className={statusColors[property.status]}>
                      {statusLabels[property.status]}
                    </Badge>
                  </div>

                  <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {property.city?.name || "Sin ciudad"}, {property.province?.name || "Sin provincia"}
                  </div>

                  <div className="mb-3 text-sm text-muted-foreground">
                    <span className="font-medium">{property.propertyType?.name || "Sin tipo"}</span>
                    {property.bedrooms && property.bathrooms && (
                      <span className="ml-2">
                        • {property.bedrooms} hab • {property.bathrooms} baños
                      </span>
                    )}
                  </div>

                  <div className="mb-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">${property.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{property.currency}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">Por {property.createdBy.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/properties/${property.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      {(currentUser.role === "ADMIN" || property.createdById === currentUser.id) && (
                        <DeletePropertyButton propertyId={property.id} propertyTitle={property.title} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
