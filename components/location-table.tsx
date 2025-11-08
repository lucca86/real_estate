"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Search } from "lucide-react"
import Link from "next/link"
import { deleteLocation } from "@/lib/actions/locations"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LocationTableProps {
  data: any[]
  type: "country" | "province" | "city" | "neighborhood"
  columns: { key: string; label: string }[]
  filterOptions?: {
    countries?: { id: string; name: string }[]
    provinces?: { id: string; name: string }[]
    cities?: { id: string; name: string }[]
  }
}

export function LocationTable({ data, type, columns, filterOptions }: LocationTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [parentFilter, setParentFilter] = useState<string>("all")

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await deleteLocation(type, deleteId)
      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting location:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getEditUrl = (id: string) => {
    const typeMap = {
      country: "countries",
      province: "provinces",
      city: "cities",
      neighborhood: "neighborhoods",
    }
    return `/locations/${typeMap[type]}/${id}/edit`
  }

  const getValue = (item: any, key: string) => {
    const keys = key.split(".")
    let value = item
    for (const k of keys) {
      value = value?.[k]
    }
    return value
  }

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchLower) ||
        columns.some((col) => {
          const value = getValue(item, col.key)
          return value && String(value).toLowerCase().includes(searchLower)
        })

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive)

      // Parent filter (for provinces, cities, neighborhoods)
      let matchesParent = true
      if (parentFilter !== "all") {
        if (type === "province" && item.countryId) {
          matchesParent = item.countryId === parentFilter
        } else if (type === "city" && item.provinceId) {
          matchesParent = item.provinceId === parentFilter
        } else if (type === "neighborhood" && item.cityId) {
          matchesParent = item.cityId === parentFilter
        }
      }

      return matchesSearch && matchesStatus && matchesParent
    })
  }, [data, searchQuery, statusFilter, parentFilter, type, columns])

  const showParentFilter = type !== "country"
  const parentFilterLabel =
    type === "province" ? "País" : type === "city" ? "Provincia" : type === "neighborhood" ? "Ciudad" : ""

  const parentFilterData =
    type === "province"
      ? filterOptions?.countries
      : type === "city"
        ? filterOptions?.provinces
        : type === "neighborhood"
          ? filterOptions?.cities
          : []

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay registros disponibles</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          {showParentFilter && parentFilterData && parentFilterData.length > 0 && (
            <Select value={parentFilter} onValueChange={setParentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={parentFilterLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {parentFilterData.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No se encontraron resultados</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column.key}>{getValue(item, column.key)}</TableCell>
                ))}
                <TableCell>
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={getEditUrl(item.id)}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(item.id)}
                      disabled={getValue(item, "_count.properties") > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
