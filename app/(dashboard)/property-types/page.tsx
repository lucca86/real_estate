import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Building2, Edit } from 'lucide-react'
import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Tipos de Propiedad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {propertyTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
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
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propertyTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{type.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? "default" : "secondary"}>
                        {type.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/property-types/${type.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
