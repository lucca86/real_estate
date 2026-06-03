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

  // Collect all IDs needed for related lookups
  const neighborhoodIds = [...new Set((properties as any[]).map((p) => p.neighborhood_id).filter(Boolean))]
  const cityIds = [...new Set((properties as any[]).map((p) => p.city_id).filter(Boolean))]
  const provinceIds = [...new Set((properties as any[]).map((p) => p.province_id).filter(Boolean))]
  const propertyTypeIds = [...new Set((properties as any[]).map((p) => p.property_type_id).filter(Boolean))]
  const ownerIds = [...new Set((properties as any[]).map((p) => p.owner_id).filter(Boolean))]
  const userIds = [...new Set((properties as any[]).map((p: any) => p.updated_by_id).filter(Boolean))]

  // Fetch all lookup tables in parallel
  const [nbRes, ciRes, prRes, ptRes, owRes, usRes] = await Promise.all([
    neighborhoodIds.length ? supabase.from("neighborhoods").select("id, name").in("id", neighborhoodIds) : { data: [] as any[] },
    cityIds.length ? supabase.from("cities").select("id, name").in("id", cityIds) : { data: [] as any[] },
    provinceIds.length ? supabase.from("provinces").select("id, name").in("id", provinceIds) : { data: [] as any[] },
    propertyTypeIds.length ? supabase.from("property_types").select("id, name").in("id", propertyTypeIds) : { data: [] as any[] },
    ownerIds.length ? supabase.from("owners").select("id, name, phone").in("id", ownerIds) : { data: [] as any[] },
    userIds.length ? supabase.from("users").select("id, name").in("id", userIds) : { data: [] as any[] },
  ])

  // Build lookup maps
  const nbMap: Record<string, any> = Object.fromEntries((nbRes.data ?? []).map((r: any) => [r.id, r]))
  const ciMap: Record<string, any> = Object.fromEntries((ciRes.data ?? []).map((r: any) => [r.id, r]))
  const prMap: Record<string, any> = Object.fromEntries((prRes.data ?? []).map((r: any) => [r.id, r]))
  const ptMap: Record<string, any> = Object.fromEntries((ptRes.data ?? []).map((r: any) => [r.id, r]))
  const owMap: Record<string, any> = Object.fromEntries((owRes.data ?? []).map((r: any) => [r.id, r]))
  const usMap: Record<string, any> = Object.fromEntries((usRes.data ?? []).map((r: any) => [r.id, r]))

  console.log("[v0] nbMap sample:", JSON.stringify(Object.entries(nbMap).slice(0, 3)))
  console.log("[v0] neighborhoodIds:", neighborhoodIds.slice(0, 3))
  // Assemble final objects — explicit fields override anything from the raw Supabase row
  const propertiesWithUsers = (properties as any[]).map((p) => ({
    ...p,
    neighborhood: p.neighborhood_id ? (nbMap[p.neighborhood_id] ?? null) : null,
    city: p.city_id ? (ciMap[p.city_id] ?? null) : null,
    province: p.province_id ? (prMap[p.province_id] ?? null) : null,
    property_type: p.property_type_id ? (ptMap[p.property_type_id] ?? null) : null,
    owner: p.owner_id ? (owMap[p.owner_id] ?? null) : null,
    updatedBy: p.updated_by_id ? (usMap[p.updated_by_id] ?? null) : null,
  }))

  console.log("[v0] first property neighborhood:", JSON.stringify(propertiesWithUsers[0]?.neighborhood))
  console.log("[v0] first property city:", JSON.stringify(propertiesWithUsers[0]?.city))

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
