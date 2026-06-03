import { getCurrentUser, checkPermission } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PropertiesTable } from "@/components/properties-table"
import { PropertiesFilters } from "@/components/properties-filters"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { PropertiesPagination } from "@/components/properties-pagination"

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const [canCreate, canDelete] = await Promise.all([
    checkPermission("properties.create"),
    checkPermission("properties.delete"),
  ])

  const params = await searchParams

  const search = params.search as string
  const propertyType = params.propertyType as string
  const transactionType = params.transactionType as string
  const status = params.status as string
  const city = params.city as string
  const neighborhood = params.neighborhood as string
  const minPrice = params.minPrice as string
  const maxPrice = params.maxPrice as string
  const bedrooms = params.bedrooms as string
  const bathrooms = params.bathrooms as string
  const activeOnly = params.activeOnly !== "false"
  const syncedOnly = params.syncedOnly === "true"
  const updatedBy = params.updatedBy as string

  const page = params.page ? Number.parseInt(params.page as string) : 1
  const limit = params.limit ? Number.parseInt(params.limit as string) : 12
  const offset = (page - 1) * limit

  const supabase = await createAdminClient()

  let countQuery = supabase.from("properties").select("*", { count: "exact", head: true })

  if (activeOnly) {
    countQuery = countQuery.eq("status", "ACTIVO")
  }

  if (search) {
    countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (propertyType) {
    countQuery = countQuery.eq("property_type_id", propertyType)
  }

  if (transactionType && transactionType !== "Todas") {
    countQuery = countQuery.eq("transaction_type", transactionType)
  }

  if (status && status !== "Todos") {
    countQuery = countQuery.eq("status", status)
  }

  if (city) {
    countQuery = countQuery.eq("city_id", city)
  }

  if (neighborhood) {
    countQuery = countQuery.eq("neighborhood_id", neighborhood)
  }

  if (minPrice) {
    countQuery = countQuery.gte("price", Number.parseFloat(minPrice))
  }

  if (maxPrice) {
    countQuery = countQuery.lte("price", Number.parseFloat(maxPrice))
  }

  if (bedrooms && bedrooms !== "Cualquiera") {
    countQuery = countQuery.gte("bedrooms", Number.parseInt(bedrooms))
  }

  if (bathrooms && bathrooms !== "Cualquiera") {
    countQuery = countQuery.gte("bathrooms", Number.parseInt(bathrooms))
  }

  if (syncedOnly) {
    countQuery = countQuery.not("wordpress_id", "is", null)
  }

  if (updatedBy) {
    countQuery = countQuery.eq("updated_by_id", updatedBy)
  }

  const { count } = await countQuery

  let query = supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (activeOnly) {
    query = query.eq("status", "ACTIVO")
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (propertyType) {
    query = query.eq("property_type_id", propertyType)
  }

  if (transactionType && transactionType !== "Todas") {
    query = query.eq("transaction_type", transactionType)
  }

  if (status && status !== "Todos") {
    query = query.eq("status", status)
  }

  if (city) {
    query = query.eq("city_id", city)
  }

  if (neighborhood) {
    query = query.eq("neighborhood_id", neighborhood)
  }

  if (minPrice) {
    query = query.gte("price", Number.parseFloat(minPrice))
  }

  if (maxPrice) {
    query = query.lte("price", Number.parseFloat(maxPrice))
  }

  if (bedrooms && bedrooms !== "Cualquiera") {
    query = query.gte("bedrooms", Number.parseInt(bedrooms))
  }

  if (bathrooms && bathrooms !== "Cualquiera") {
    query = query.gte("bathrooms", Number.parseInt(bathrooms))
  }

  if (syncedOnly) {
    query = query.not("wordpress_id", "is", null)
  }

  if (updatedBy) {
    query = query.eq("updated_by_id", updatedBy)
  }

  const { data: properties, error } = await query

  if (error) {
    console.error("[v0] Error fetching properties:", error)
    return <div>Error al cargar propiedades</div>
  }

  const anonClient = await createClient()

  const allProps = properties || []
  const neighborhoodIds = [...new Set(allProps.map((p: any) => p.neighborhood_id).filter(Boolean))]
  const cityIds = [...new Set(allProps.map((p: any) => p.city_id).filter(Boolean))]
  const provinceIds = [...new Set(allProps.map((p: any) => p.province_id).filter(Boolean))]
  const propertyTypeIds = [...new Set(allProps.map((p: any) => p.property_type_id).filter(Boolean))]
  const ownerIds = [...new Set(allProps.map((p: any) => p.owner_id).filter(Boolean))]
  const userIds = [...new Set(allProps.map((p: any) => p.updated_by_id).filter(Boolean))]

  const [nbRes, ciRes, prRes, ptRes, owRes, usRes] = await Promise.all([
    neighborhoodIds.length ? anonClient.from("neighborhoods").select("id, name").in("id", neighborhoodIds) : { data: [] as any[] },
    cityIds.length ? anonClient.from("cities").select("id, name").in("id", cityIds) : { data: [] as any[] },
    provinceIds.length ? anonClient.from("provinces").select("id, name").in("id", provinceIds) : { data: [] as any[] },
    propertyTypeIds.length ? anonClient.from("property_types").select("id, name").in("id", propertyTypeIds) : { data: [] as any[] },
    ownerIds.length ? supabase.from("owners").select("id, name, phone").in("id", ownerIds) : { data: [] as any[] },
    userIds.length ? supabase.from("users").select("id, name").in("id", userIds) : { data: [] as any[] },
  ])

  const nbMap: Record<string, any> = Object.fromEntries((nbRes.data ?? []).map((r: any) => [r.id, r]))
  const ciMap: Record<string, any> = Object.fromEntries((ciRes.data ?? []).map((r: any) => [r.id, r]))
  const prMap: Record<string, any> = Object.fromEntries((prRes.data ?? []).map((r: any) => [r.id, r]))
  const ptMap: Record<string, any> = Object.fromEntries((ptRes.data ?? []).map((r: any) => [r.id, r]))
  const owMap: Record<string, any> = Object.fromEntries((owRes.data ?? []).map((r: any) => [r.id, r]))
  const usMap: Record<string, any> = Object.fromEntries((usRes.data ?? []).map((r: any) => [r.id, r]))

  const propertiesWithUsers = allProps.map((p: any) => ({
    ...p,
    neighborhood: p.neighborhood_id ? (nbMap[p.neighborhood_id] ?? null) : null,
    city: p.city_id ? (ciMap[p.city_id] ?? null) : null,
    province: p.province_id ? (prMap[p.province_id] ?? null) : null,
    property_type: p.property_type_id ? (ptMap[p.property_type_id] ?? null) : null,
    owner: p.owner_id ? (owMap[p.owner_id] ?? null) : null,
    updatedBy: p.updated_by_id ? (usMap[p.updated_by_id] ?? null) : null,
  }))

  const totalPages = count ? Math.ceil(count / limit) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Propiedades</h1>
          <p className="text-muted-foreground">Gestiona el inventario de propiedades</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" asChild className="w-full sm:w-auto bg-transparent">
            <Link href="/propietarios" target="_blank">
              <FileText className="mr-2 h-4 w-4" />
              Formulario Propietarios
            </Link>
          </Button>
          {canCreate && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Propiedad
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-80 lg:shrink-0">
          <PropertiesFilters activeOnly={activeOnly} />
        </aside>

        <main className="flex-1 space-y-4 min-w-0">
              <PropertiesTable properties={propertiesWithUsers || []} currentUser={user} canDelete={canDelete} />

          {totalPages > 1 && (
            <PropertiesPagination
              currentPage={page}
              totalPages={totalPages}
              limit={limit}
              total={count || 0}
              offset={offset}
            />
          )}
        </main>
      </div>
    </div>
  )
}
