import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createServerClient } from "@/lib/supabase/server"
import { Building2, MapPin } from 'lucide-react'
import Link from "next/link"

export async function RecentProperties() {
  const statusColors: Record<string, string> = {
    ACTIVO: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    RESERVADO: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    VENDIDO: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    ALQUILADO: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    ELIMINADO: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    EN_REVISION: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  }

  const statusLabels: Record<string, string> = {
    ACTIVO: "Activo",
    RESERVADO: "Reservado",
    VENDIDO: "Vendido",
    ALQUILADO: "Alquilado",
    ELIMINADO: "Eliminado",
    EN_REVISION: "En Revisión",
  }

  try {
    console.log("[v0] RecentProperties: Starting to fetch properties")

    const supabase = await createServerClient()

    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        *,
        created_by:users!properties_created_by_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error || !properties) {
      throw error
    }

    console.log("[v0] RecentProperties: Successfully fetched", properties.length, "properties")

    return (
      <Card>
        <CardHeader>
          <CardTitle>Propiedades Recientes</CardTitle>
          <CardDescription>Las últimas propiedades agregadas al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No hay propiedades registradas</p>
                <Link href="/properties/new" className="mt-2 text-sm text-primary hover:underline">
                  Agregar primera propiedad
                </Link>
              </div>
            ) : (
              properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold leading-none text-balance">{property.title}</h4>
                      <Badge variant="secondary" className={statusColors[property.status] || ""}>
                        {statusLabels[property.status] || property.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {property.city}, {property.state}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">
                        ${property.price.toLocaleString()} {property.currency}
                      </span>
                      <span className="text-muted-foreground">Por {property.created_by?.name}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error("[v0] RecentProperties: Error fetching properties:", error)

    return (
      <Card>
        <CardHeader>
          <CardTitle>Propiedades Recientes</CardTitle>
          <CardDescription>Las últimas propiedades agregadas al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">Error al cargar propiedades</p>
          </div>
        </CardContent>
      </Card>
    )
  }
}
