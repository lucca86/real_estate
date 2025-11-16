import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { getAllProvinces } from "@/lib/actions/locations"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Edit } from 'lucide-react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function ProvincesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getAllProvinces()

  if (!result.success || !result.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Error al cargar provincias</p>
      </div>
    )
  }

  const provinces = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provincias</h1>
          <p className="text-muted-foreground">Gestiona las provincias del sistema</p>
        </div>
        <Button asChild>
          <Link href="/locations/provinces/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Provincia
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lista de Provincias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {provinces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No hay provincias registradas</p>
              <Button asChild className="mt-4">
                <Link href="/locations/provinces/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera provincia
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provinces.map((province) => (
                  <TableRow key={province.id}>
                    <TableCell className="font-medium">{province.name}</TableCell>
                    <TableCell>{province.country?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={province.is_active ? "default" : "secondary"}>
                        {province.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/locations/provinces/${province.id}/edit`}>
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
