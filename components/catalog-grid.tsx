import { createServerClient } from "@/lib/supabase/server"
import { CatalogPropertyCard } from "./catalog-property-card"
import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from 'lucide-react'

interface CatalogGridProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function CatalogGrid({ searchParams }: CatalogGridProps) {
  const search = searchParams.search as string
  const propertyType = searchParams.propertyType as string
  const transactionType = searchParams.transactionType as string
  const status = searchParams.status as string
  const city = searchParams.city as string
  const minPrice = searchParams.minPrice as string
  const maxPrice = searchParams.maxPrice as string
  const bedrooms = searchParams.bedrooms as string
  const bathrooms = searchParams.bathrooms as string

  const supabase = await createServerClient()
  
  let query = supabase
    .from('properties')
    .select(`
      *,
      owner:owners!properties_owner_id_fkey(name, phone)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (propertyType) {
    query = query.eq('property_type', propertyType)
  }

  if (transactionType) {
    query = query.eq('transaction_type', transactionType)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (city) {
    query = query.ilike('city', `%${city}%`)
  }

  if (minPrice) {
    query = query.gte('price', Number.parseFloat(minPrice))
  }

  if (maxPrice) {
    query = query.lte('price', Number.parseFloat(maxPrice))
  }

  if (bedrooms) {
    query = query.gte('bedrooms', Number.parseInt(bedrooms))
  }

  if (bathrooms) {
    query = query.gte('bathrooms', Number.parseInt(bathrooms))
  }

  const { data: properties, error } = await query

  if (error || !properties) {
    console.error('[v0] Error fetching catalog:', error)
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Error al cargar propiedades</h3>
        </CardContent>
      </Card>
    )
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No se encontraron propiedades</h3>
          <p className="mt-2 text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {properties.length} {properties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <CatalogPropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  )
}
