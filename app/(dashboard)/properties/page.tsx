import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PropertiesTable } from "@/components/properties-table"
import { PropertiesFilters } from "@/components/properties-filters"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { getUserPermissions } from "@/lib/permissions"

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const permissions = await getUserPermissions(user.id)
  const canCreate = permissions["properties.create"]

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

  const supabase = await createServerClient()

  let query = supabase
    .from("properties")
    .select(`
      *,
      owner:owners!owner_id(name),
      propertyType:property_types!property_type_id(name),
      city:cities!city_id(name),
      province:provinces!province_id(name)
    `)
    .order("created_at", { ascending: false })

  if (activeOnly) {
    query = query.eq("status", "ACTIVO")
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (propertyType && propertyType !== "Todos") {
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

  const { data: properties, error } = await query

  if (error) {
    console.log("[v0] Error fetching properties:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Propiedades</h1>
          <p className="text-muted-foreground">Gestiona el inventario de propiedades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/propietarios" target="_blank">
              <FileText className="mr-2 h-4 w-4" />
              Formulario Propietarios
            </Link>
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href="/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Propiedad
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <PropertiesFilters activeOnly={activeOnly} />
        </aside>

        <main>
          <PropertiesTable properties={properties || []} currentUser={user} />
        </main>
      </div>
    </div>
  )
}
