"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Mail, Phone, Pencil, MapPin } from "lucide-react"
import Link from "next/link"
import { DeleteOwnerButton } from "./delete-owner-button"

interface Owner {
  id: string
  name: string
  email: string
  phone: string
  address: string | null
  cityId: string | null
  provinceId: string | null
  countryId: string | null
  city: { id: string; name: string } | null
  province: { id: string; name: string } | null
  country: { id: string; name: string } | null
  _count: {
    properties: number
  }
}

interface OwnersTableProps {
  owners: Owner[]
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function OwnersTable({ owners }: OwnersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Filtrar propietarios
  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      // Filtro de búsqueda por texto
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        owner.name.toLowerCase().includes(searchLower) ||
        owner.email.toLowerCase().includes(searchLower) ||
        owner.phone.includes(searchQuery)

      // Filtro por letra
      const matchesLetter = !selectedLetter || owner.name.toUpperCase().startsWith(selectedLetter)

      return matchesSearch && matchesLetter
    })
  }, [owners, searchQuery, selectedLetter])

  // Paginación
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOwners = filteredOwners.slice(startIndex, startIndex + itemsPerPage)

  // Contar propietarios por letra
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ALPHABET.forEach((letter) => {
      counts[letter] = owners.filter((o) => o.name.toUpperCase().startsWith(letter)).length
    })
    return counts
  }, [owners])

  return (
    <div className="space-y-6">
      {/* Barra alfabética */}
      <div className="flex flex-wrap gap-1 p-4 bg-muted/30 rounded-lg border">
        <Button
          variant={selectedLetter === null ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setSelectedLetter(null)
            setCurrentPage(1)
          }}
          className="h-8 px-3"
        >
          Todos
        </Button>
        {ALPHABET.map((letter) => (
          <Button
            key={letter}
            variant={selectedLetter === letter ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setSelectedLetter(letter)
              setCurrentPage(1)
            }}
            className="h-8 w-8 p-0"
            disabled={letterCounts[letter] === 0}
          >
            {letter}
            {letterCounts[letter] > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">({letterCounts[letter]})</span>
            )}
          </Button>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Resultados y paginación */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredOwners.length)} de{" "}
          {filteredOwners.length} propietarios
        </div>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(Number(value))
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de propietarios */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Propiedades</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOwners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No se encontraron propietarios
                </TableCell>
              </TableRow>
            ) : (
              paginatedOwners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell>
                    <Link href={`/owners/${owner.id}/edit`} className="font-medium hover:underline">
                      {owner.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <a href={`mailto:${owner.email}`} className="hover:underline">
                          {owner.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${owner.phone}`} className="hover:underline">
                          {owner.phone}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {owner.city || owner.province ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {[owner.city?.name, owner.province?.name].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{owner._count.properties} propiedades</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/owners/${owner.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteOwnerButton ownerId={owner.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}

export default OwnersTable
