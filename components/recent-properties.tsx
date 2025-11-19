import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createServerClient } from "@/lib/supabase/server"
import { Building2, MapPin } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Property {
  id: string
  title: string
  price: number
  created_at: string
  property_types: { name: string } | null
  cities: { name: string } | null
}

interface RecentPropertiesProps {
  properties: Property[]
}

export async function getRecentProperties() {
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
      .from('Property')
      .select(`
        *,
        createdBy:User!createdById(name)
      `)
      .order('createdAt', { ascending: false })
      .limit(5)

    if (error || !properties) {
      throw error
    }

    console.log("[v0] RecentProperties: Successfully fetched", properties.length, "properties")

    return properties.map(property => ({
      id: property.id,
      title: property.title,
      price: property.price,
      created_at: property.createdAt,
      property_types: property.property_types,
      cities: property.cities,
    }))
  } catch (error) {
    console.error("[v0] RecentProperties: Error fetching properties:", error)
    return []
  }
}

export function RecentProperties({ properties }: RecentPropertiesProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Propiedades Recientes</CardTitle>
        <CardDescription>Últimas propiedades agregadas al sistema</CardDescription>
      </CardHeader>
      <CardContent>
        {properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <Link
                    href={`/properties/${property.id}`}
                    className="font-medium hover:underline"
                  >
                    {property.title}
                  </Link>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{property.property_types?.name || "Sin tipo"}</span>
                    <span>•</span>
                    <span>{property.cities?.name || "Sin ciudad"}</span>
                    <span>•</span>
                    <span>{formatDate(property.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice(property.price)}</div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/properties/${property.id}`}>Ver detalles</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No hay propiedades registradas aún
          </div>
        )}
      </CardContent>
    </Card>
  )
}
