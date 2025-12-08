"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Mail, Phone, Building2, Pencil } from "lucide-react"
import Link from "next/link"
import { DeleteContactButton } from "./delete-contact-button"

interface Service {
  id: string
  name: string
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  company: string | null
  email: string | null
  phone: string
  address: string | null
  website: string | null
  notes: string | null
  isActive: boolean
  services: Array<{
    service: Service
  }>
}

interface ContactsTableProps {
  contacts: Contact[]
  services: Service[]
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function ContactsTable({ contacts, services }: ContactsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Filtrar contactos
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Filtro de búsqueda por texto
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower)

      // Filtro por letra
      const matchesLetter = !selectedLetter || contact.lastName.toUpperCase().startsWith(selectedLetter)

      // Filtro por servicio
      const matchesService =
        selectedService === "all" || contact.services.some((cs) => cs.service.id === selectedService)

      // Filtro por estado
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && contact.isActive) ||
        (selectedStatus === "inactive" && !contact.isActive)

      return matchesSearch && matchesLetter && matchesService && matchesStatus
    })
  }, [contacts, searchQuery, selectedLetter, selectedService, selectedStatus])

  // Paginación
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage)

  // Contar contactos por letra
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ALPHABET.forEach((letter) => {
      counts[letter] = contacts.filter((c) => c.lastName.toUpperCase().startsWith(letter)).length
    })
    return counts
  }, [contacts])

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
            placeholder="Buscar por apellido, empresa, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={selectedService}
          onValueChange={(value) => {
            setSelectedService(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los servicios</SelectItem>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus}
          onValueChange={(value) => {
            setSelectedStatus(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resultados y paginación */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredContacts.length)} de{" "}
          {filteredContacts.length} contactos
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

      {/* Tabla de contactos */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron contactos
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                      {contact.lastName}, {contact.firstName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {contact.company ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {contact.company}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${contact.email}`} className="hover:underline">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${contact.phone}`} className="hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.services.length > 0 ? (
                        contact.services.map((cs) => (
                          <Badge key={cs.service.id} variant="secondary" className="text-xs">
                            {cs.service.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin servicios</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.isActive ? "default" : "secondary"} className="bg-blue-100 text-blue-800">
                      {contact.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/contacts/${contact.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteContactButton contactId={contact.id} />
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
