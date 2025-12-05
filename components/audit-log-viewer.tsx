"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Activity, Download, Filter, Search, User, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { AuditLogEntry } from "@/lib/audit"

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [stats, setStats] = useState<any>(null)

  // Filters
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    loadAuditLogs()
    loadStats()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, moduleFilter, actionFilter, searchQuery, dateFrom, dateTo])

  async function loadAuditLogs() {
    setLoading(true)
    try {
      const response = await fetch("/api/audit")
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error("[v0] Error loading audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      const response = await fetch("/api/audit/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error loading stats:", error)
    }
  }

  function applyFilters() {
    let filtered = [...logs]

    if (moduleFilter !== "all") {
      filtered = filtered.filter((log) => log.module === moduleFilter)
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.user_name?.toLowerCase().includes(query) ||
          log.entity_type?.toLowerCase().includes(query) ||
          log.entity_id?.toLowerCase().includes(query),
      )
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((log) => new Date(log.created_at) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((log) => new Date(log.created_at) <= toDate)
    }

    setFilteredLogs(filtered)
  }

  function exportToCSV() {
    const headers = ["Fecha", "Módulo", "Acción", "Usuario", "Entidad", "Cambios"]
    const rows = filteredLogs.map((log) => [
      format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss"),
      log.module,
      log.action,
      log.user_name || "Sistema",
      `${log.entity_type} ${log.entity_id || ""}`,
      JSON.stringify(log.changes || {}),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  const moduleLabels: Record<string, string> = {
    users: "Usuarios",
    properties: "Propiedades",
    property_types: "Tipos de Propiedad",
    owners: "Propietarios",
    clients: "Clientes",
    contacts: "Contactos",
    services: "Servicios",
    appointments: "Citas",
    locations: "Ubicaciones",
    permissions: "Permisos",
    settings: "Configuración",
  }

  const actionLabels: Record<string, string> = {
    create: "Crear",
    update: "Actualizar",
    delete: "Eliminar",
    login: "Inicio de sesión",
    logout: "Cierre de sesión",
    sync: "Sincronizar",
    restore: "Restaurar",
    enable: "Activar",
    disable: "Desactivar",
  }

  const actionColors: Record<string, string> = {
    create: "bg-green-500/10 text-green-500",
    update: "bg-blue-500/10 text-blue-500",
    delete: "bg-red-500/10 text-red-500",
    login: "bg-purple-500/10 text-purple-500",
    logout: "bg-orange-500/10 text-orange-500",
    sync: "bg-cyan-500/10 text-cyan-500",
    restore: "bg-yellow-500/10 text-yellow-500",
    enable: "bg-emerald-500/10 text-emerald-500",
    disable: "bg-gray-500/10 text-gray-500",
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Módulo más usado</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(stats.moduleCounts).length > 0
                  ? moduleLabels[
                      Object.entries(stats.moduleCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
                    ]
                  : "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs Filtrados</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLogs.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra los registros de auditoría por módulo, acción, fecha o búsqueda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario, entidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los módulos</SelectItem>
                {Object.entries(moduleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {Object.entries(actionLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" placeholder="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />

            <Input type="date" placeholder="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
          <CardDescription>Historial completo de acciones en el sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando registros...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No se encontraron registros</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Módulo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Entidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Detalles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.user_name || "Sistema"}</span>
                          {log.user_role && (
                            <span className="text-xs text-muted-foreground">
                              {log.user_role === "ADMIN"
                                ? "Administrador"
                                : log.user_role === "SUPERVISOR"
                                  ? "Supervisor"
                                  : "Agente"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">{moduleLabels[log.module] || log.module}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="secondary" className={actionColors[log.action] || ""}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.entity_type}</span>
                          {log.entity_id && <span className="text-xs text-muted-foreground">{log.entity_id}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Registro</DialogTitle>
            <DialogDescription>Información completa de la acción realizada</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha y Hora</p>
                  <p className="text-sm">{format(new Date(selectedLog.created_at), "PPpp", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuario</p>
                  <p className="text-sm">{selectedLog.user_name || "Sistema"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Módulo</p>
                  <p className="text-sm">{moduleLabels[selectedLog.module] || selectedLog.module}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Acción</p>
                  <p className="text-sm">{actionLabels[selectedLog.action] || selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Entidad</p>
                  <p className="text-sm">{selectedLog.entity_type}</p>
                </div>
                {selectedLog.entity_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID de Entidad</p>
                    <p className="text-sm font-mono">{selectedLog.entity_id}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dirección IP</p>
                    <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Cambios Realizados</p>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
