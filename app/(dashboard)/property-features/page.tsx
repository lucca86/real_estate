import { getAllPropertyFeatures } from "@/lib/actions/property-features"
import { PropertyFeaturesTable } from "@/components/property-features-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function PropertyFeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const features = await getAllPropertyFeatures()

  const filteredFeatures = status
    ? features.filter((f) => (status === "active" ? f.is_active : !f.is_active))
    : features

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Características y Amenidades</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las características y amenidades disponibles para las propiedades
          </p>
        </div>
        <Link href="/property-features/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nueva
          </Button>
        </Link>
      </div>

      <PropertyFeaturesTable features={filteredFeatures} initialStatus={status} />
    </div>
  )
}
