"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type City = {
  id: string
  name: string
  is_active: boolean
  created_at: string
  province: {
    name: string
  } | null
}

type CitiesTableProps = {
  cities: City[]
}

export function CitiesTableWithFilters({ cities }: CitiesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [provinceFilter, setProvinceFilter] = useState<string>("Todos")
  const [statusFilter, setStatusFilter] = useState<string>("Todos")
  const [sortColumn, setSortColumn] = useState<"name" | "province" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Get unique provinces for filter
  const provinces = useMemo(() => {
    const uniqueProvinces = new Set(
      cities.map((city) => city.province?.name).filter(Boolean) as string[]
    )
    return ["Todos", ...Array.from(uniqueProvinces).sort()]
  }, [cities])

  // Filter and sort cities
  const filteredAndSortedCities = useMemo(() => {
    let filtered = cities.filter((city) => {
      const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesProvince =
        provinceFilter === "Todos" || city.province?.name === provinceFilter
      const matchesStatus =
        statusFilter === "Todos" ||
        (statusFilter === "Activo" && city.is_active) ||
        (statusFilter === "Inactivo" && !city.is_active)

      return matchesSearch && matchesProvince && matchesStatus
    })

    // Sort
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue = ""
        let bValue = ""

        if (sortColumn === "name") {
          aValue = a.name
          bValue = b.name
        } else if (sortColumn === "province") {
          aValue = a.province?.name || ""
          bValue = b.province?.name || ""
        }

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }

    return filtered
  }, [cities, searchTerm, provinceFilter, statusFilter, sortColumn, sortDirection])

  const handleSort = (column: "name" | "province") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={provinceFilter} onValueChange={setProvinceFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por provincia" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Activo">Activo</SelectItem>
            <SelectItem value="Inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("name")}
            >
              Nombre {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("province")}
            >
              Provincia {sortColumn === "province" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedCities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No se encontraron ciudades
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedCities.map((city) => (
              <TableRow key={city.id}>
                <TableCell className="font-medium">{city.name}</TableCell>
                <TableCell>{city.province?.name || "-"}</TableCell>
                <TableCell>
                  <Badge variant={city.is_active ? "default" : "secondary"}>
                    {city.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/locations/cities/${city.id}/edit`}>
                        {/* Added icon component for Edit button */}
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm-1 6a1 1 0 112 0v1a1 1 0 01-2 0v-1zm-1-6a1 1 0 012 0V4a1 1 0 01-2 0zm1 16a1 1 0 01-1-1V8a1 1 0 012 0v11a1 1 0 01-1 1zm-1-6a1 1 0 112 0v1a1 1 0 01-2 0v-1z"></path></svg>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/locations/cities/${city.id}/delete`}>
                        {/* Added icon component for Trash button */}
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0117.832 21H6.168a2 2 0 01-1.995-1.858L5 7m3 0V13a2 2 0 004 0V7m6 0V13a2 2 0 004 0V7h-14zm4 0a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V8a1 1 0 00-1-1h-6z"></path></svg>
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
