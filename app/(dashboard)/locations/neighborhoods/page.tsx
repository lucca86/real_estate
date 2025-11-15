import { getCurrentUser } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { getAllNeighborhoods } from "@/lib/actions/locations"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Edit } from 'lucide-react'
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function NeighborhoodsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getAllNeighborhoods()

  if (!result.success || !result.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Error al cargar barrios</p>
      </div>
    )
  }

  const neighborhoods = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barrios</h1>
          <p className="text-muted-foreground">Gestiona los barrios del sistema</p>
        </div>
        <Button asChild>
          <Link href="/locations/neighborhoods/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Barrio
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lista de Barrios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {neighborhoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">No hay barrios registrados</p>
              <Button asChild className="mt-4">
                <Link href="/locations/neighborhoods/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer barrio
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {neighborhoods.map((neighborhood) => (
                  <TableRow key={neighborhood.id}>
                    <TableCell className="font-medium">{neighborhood.name}</TableCell>
                    <TableCell>{Array.isArray(neighborhood.city) ? neighborhood.city[0]?.name : neighborhood.city?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={neighborhood.is_active ? "default" : "secondary"}>
                        {neighborhood.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/locations/neighborhoods/${neighborhood.id}/edit`}>
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
