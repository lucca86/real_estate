"use client"

import { Input } from "@/components/ui/input"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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



  const provinces = useMemo(() => {
    const uniqueProvinces = new Set<string>()
    cities.forEach((city) => {
      if (city.province && city.province.name) {
        uniqueProvinces.add(city.province.name)
      }
    })
    return ["Todos", ...Array.from(uniqueProvinces).sort()]
  }, [cities])

  const filteredAndSortedCities = useMemo(() => {
    const filtered = cities.filter((city) => {
      const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase())
      const cityProvinceName = city.province?.name || ""
      const matchesProvince = provinceFilter === "Todos" || cityProvinceName === provinceFilter
      const cityIsActive = Boolean(city.is_active)
      const matchesStatus =
        statusFilter === "Todos" ||
        (statusFilter === "Activo" && cityIsActive) ||
        (statusFilter === "Inactivo" && !cityIsActive)
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
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")}>
              Nombre {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("province")}>
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
            filteredAndSortedCities.map((city) => {
              const isActive = Boolean(city.is_active)

              return (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.province?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Activa" : "Inactiva"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/locations/cities/${city.id}/edit`}>
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1.5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            />
                          </svg>
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
