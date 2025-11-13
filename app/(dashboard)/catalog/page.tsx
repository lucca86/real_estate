import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CatalogFilters } from "@/components/catalog-filters"
import { CatalogGrid } from "@/components/catalog-grid"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const params = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Catálogo de Propiedades</h1>
        <p className="text-muted-foreground">Busca y filtra propiedades disponibles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <CatalogFilters />
        </aside>

        <main>
          <CatalogGrid searchParams={params} />
        </main>
      </div>
    </div>
  )
}
