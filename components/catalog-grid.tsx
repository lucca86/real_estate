import { prisma } from "@/lib/db"
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

  const where: any = {
    published: true,
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ]
  }

  if (propertyType) {
    where.propertyType = propertyType
  }

  if (transactionType) {
    where.transactionType = transactionType
  }

  if (status) {
    where.status = status
  }

  if (city) {
    where.city = { contains: city, mode: "insensitive" }
  }

  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = Number.parseFloat(minPrice)
    if (maxPrice) where.price.lte = Number.parseFloat(maxPrice)
  }

  if (bedrooms) {
    where.bedrooms = { gte: Number.parseInt(bedrooms) }
  }

  if (bathrooms) {
    where.bathrooms = { gte: Number.parseInt(bathrooms) }
  }

  const properties = await prisma.property.findMany({
    where,
    orderBy: [{ propertyLabel: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  })

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
