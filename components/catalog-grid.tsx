import { createAdminClient } from "@/lib/supabase/server"
import { CatalogPropertyCard } from "./catalog-property-card"
import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from "lucide-react"

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

  const supabase = await createAdminClient()

  let query = supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (propertyType) {
    query = query.eq("property_type_id", propertyType)
  }

  if (transactionType) {
    query = query.eq("transaction_type", transactionType)
  }

  if (status) {
    query = query.eq("status", status)
  }

  if (city) {
    query = query.eq("city_id", city)
  }

  if (minPrice) {
    query = query.gte("price", Number.parseFloat(minPrice))
  }

  if (maxPrice) {
    query = query.lte("price", Number.parseFloat(maxPrice))
  }

  if (bedrooms) {
    query = query.gte("bedrooms", Number.parseInt(bedrooms))
  }

  if (bathrooms) {
    query = query.gte("bathrooms", Number.parseInt(bathrooms))
  }

  const { data: properties, error } = await query

  if (error || !properties) {
    console.error("[v0] Error fetching catalog:", error)
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Error al cargar propiedades</h3>
        </CardContent>
      </Card>
    )
  }

  // Manual joins — avoids PostgREST FK resolution issues with text-typed IDs
  const neighborhoodIds = [...new Set((properties as any[]).map((p) => p.neighborhood_id).filter(Boolean))]
  const cityIds = [...new Set((properties as any[]).map((p) => p.city_id).filter(Boolean))]
  const provinceIds = [...new Set((properties as any[]).map((p) => p.province_id).filter(Boolean))]
  const propertyTypeIds = [...new Set((properties as any[]).map((p) => p.property_type_id).filter(Boolean))]
  const ownerIds = [...new Set((properties as any[]).map((p) => p.owner_id).filter(Boolean))]

  const [neighborhoodsRes, citiesRes, provincesRes, propertyTypesRes, ownersRes] = await Promise.all([
    neighborhoodIds.length > 0 ? supabase.from("neighborhoods").select("id, name").in("id", neighborhoodIds) : Promise.resolve({ data: [] }),
    cityIds.length > 0 ? supabase.from("cities").select("id, name").in("id", cityIds) : Promise.resolve({ data: [] }),
    provinceIds.length > 0 ? supabase.from("provinces").select("id, name").in("id", provinceIds) : Promise.resolve({ data: [] }),
    propertyTypeIds.length > 0 ? supabase.from("property_types").select("id, name").in("id", propertyTypeIds) : Promise.resolve({ data: [] }),
    ownerIds.length > 0 ? supabase.from("owners").select("id, name, phone").in("id", ownerIds) : Promise.resolve({ data: [] }),
  ])

  const neighborhoodsMap = Object.fromEntries((neighborhoodsRes.data ?? []).map((n: any) => [String(n.id), n]))
  const citiesMap = Object.fromEntries((citiesRes.data ?? []).map((c: any) => [String(c.id), c]))
  const provincesMap = Object.fromEntries((provincesRes.data ?? []).map((p: any) => [String(p.id), p]))
  const propertyTypesMap = Object.fromEntries((propertyTypesRes.data ?? []).map((t: any) => [String(t.id), t]))
  const ownersMap2 = Object.fromEntries((ownersRes.data ?? []).map((o: any) => [String(o.id), o]))

  // Load all updatedBy users
  const userIds = [...new Set((properties as any[]).map((p: any) => p.updated_by_id).filter(Boolean))]
  let usersMap: Record<string, { name: string }> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", userIds)
    if (users) {
      usersMap = Object.fromEntries(users.map((u) => [u.id, { name: u.name }]))
    }
  }

  const propertiesWithUsers = (properties as any[]).map((property) => ({
    ...property,
    neighborhood: property.neighborhood_id ? (neighborhoodsMap[String(property.neighborhood_id)] ?? null) : null,
    city: property.city_id ? (citiesMap[String(property.city_id)] ?? null) : null,
    province: property.province_id ? (provincesMap[String(property.province_id)] ?? null) : null,
    property_type: property.property_type_id ? (propertyTypesMap[String(property.property_type_id)] ?? null) : null,
    owner: property.owner_id ? (ownersMap2[String(property.owner_id)] ?? null) : null,
    updatedBy: property.updated_by_id ? (usersMap[property.updated_by_id] ?? null) : null,
  }))

  if (propertiesWithUsers.length === 0) {
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
          {propertiesWithUsers.length} {propertiesWithUsers.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {propertiesWithUsers.map((property: any) => (
          <CatalogPropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  )
}
