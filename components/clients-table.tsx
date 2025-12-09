"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Mail, Phone, MapPin, Calendar, Pencil, Briefcase, User } from "lucide-react"
import Link from "next/link"
import { DeleteClientButton } from "./delete-client-button"
import { ReassignAgentDialog } from "./reassign-agent-dialog"

interface City {
  id: string
  name: string
}

interface Province {
  id: string
  name: string
}

interface Agent {
  id: string
  name: string
  email: string
}

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  occupation: string | null
  budget: number | null
  isActive: boolean
  city: City | null
  province: Province | null
  agent: Agent | null
  _count: {
    appointments: number
  }
}

interface ClientsTableProps {
  clients: Client[]
  userRole: "ADMIN" | "VENDEDOR" | "SUPERVISOR"
  agents?: Agent[]
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export function ClientsTable({ clients, userRole, agents = [] }: ClientsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedAgent, setSelectedAgent] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        client.name.toLowerCase().includes(searchLower) ||
        client.email?.toLowerCase().includes(searchLower) ||
        client.occupation?.toLowerCase().includes(searchLower)

      const matchesLetter = !selectedLetter || client.name.toUpperCase().startsWith(selectedLetter)

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && client.isActive) ||
        (selectedStatus === "inactive" && !client.isActive)

      const matchesAgent = selectedAgent === "all" || client.agent?.id === selectedAgent

      return matchesSearch && matchesLetter && matchesStatus && matchesAgent
    })
  }, [clients, searchQuery, selectedLetter, selectedStatus, selectedAgent])

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ALPHABET.forEach((letter) => {
      counts[letter] = clients.filter((c) => c.name.toUpperCase().startsWith(letter)).length
    })
    return counts
  }, [clients])

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, ocupación..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>

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

        {userRole === "ADMIN" && agents.length > 0 && (
          <Select
            value={selectedAgent}
            onValueChange={(value) => {
              setSelectedAgent(value)
              setCurrentPage(1)
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Agente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredClients.length)} de{" "}
          {filteredClients.length} clientes
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ocupación</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Citas</TableHead>
              {userRole === "ADMIN" && <TableHead>Agente</TableHead>}
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === "ADMIN" ? 9 : 8} className="text-center py-8 text-muted-foreground">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {client.occupation ? (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {client.occupation}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${client.email}`} className="hover:underline">
                            {client.email}
                          </a>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${client.phone}`} className="hover:underline">
                            {client.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.city || client.province ? (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {[client.city?.name, client.province?.name].filter(Boolean).join(", ")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.budget ? (
                      <span className="font-medium">${client.budget.toLocaleString("es-DO")}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {client._count.appointments}
                    </div>
                  </TableCell>
                  {userRole === "ADMIN" && (
                    <TableCell>
                      {client.agent ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {client.agent.name}
                          </div>
                          <ReassignAgentDialog
                            clientId={client.id}
                            clientName={client.name}
                            currentAgentId={client.agent.id}
                            agents={agents}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">Sin asignar</span>
                          <ReassignAgentDialog
                            clientId={client.id}
                            clientName={client.name}
                            currentAgentId={null}
                            agents={agents}
                          />
                        </div>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={client.isActive ? "default" : "secondary"}>
                      {client.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/clients/${client.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteClientButton clientId={client.id} clientName={client.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
