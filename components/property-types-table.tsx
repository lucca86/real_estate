import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit } from "lucide-react"
import { getPropertyTypes } from "@/lib/actions/property-types"
import { DeletePropertyTypeButton } from "@/components/delete-property-type-button"

export async function PropertyTypesTable() {
  const propertyTypes = await getPropertyTypes()

  if (propertyTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No hay tipos de propiedad registrados</p>
        <Button asChild className="mt-4">
          <Link href="/property-types/new">Crear primer tipo de propiedad</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Propiedades</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {propertyTypes.map((type) => (
            <TableRow key={type.id}>
              <TableCell className="font-medium">{type.name}</TableCell>
              <TableCell className="max-w-md truncate">{type.description || "-"}</TableCell>
              <TableCell>{type._count.properties}</TableCell>
              <TableCell>
                {type.isActive ? <Badge variant="default">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/property-types/${type.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeletePropertyTypeButton id={type.id} name={type.name} propertiesCount={type._count.properties} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
