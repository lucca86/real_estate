import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from 'lucide-react'
import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PropertyTypesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERVISOR") {
    redirect("/dashboard")
  }

  const supabase = await createServerClient()
  const { data: propertyTypes, error } = await supabase
    .from('property_types')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error || !propertyTypes) {
    console.error('[v0] Error fetching property types:', error)
    return <div>Error al cargar tipos de propiedad</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Propiedad</h1>
          <p className="text-muted-foreground">Gestiona los tipos de propiedad disponibles</p>
        </div>
        <Button asChild>
          <Link href="/property-types/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tipo
          </Link>
        </Button>
      </div>

      {propertyTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay tipos de propiedad</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza creando el primer tipo de propiedad para tu catálogo
            </p>
            <Button asChild>
              <Link href="/property-types/new">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Tipo
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {propertyTypes.map((type) => (
            <Card key={type.id}>
              <CardHeader>
                <CardTitle>{type.name}</CardTitle>
                {type.description && <CardDescription>{type.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href={`/property-types/${type.id}/edit`}>Editar</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
