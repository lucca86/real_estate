"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DatabaseBackup,
  Images,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  CalendarClock,
  Settings2,
} from "lucide-react"
import {
  saveBackupSettings,
  deleteBackupRecord,
  type BackupRecord,
  type BackupSettings,
} from "@/lib/actions/backup"
import { FormattedDate } from "@/components/formatted-date"
import { formatBytes } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BackupRecord["status"] }) {
  if (status === "completed")
    return (
      <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Completado
      </Badge>
    )
  if (status === "failed")
    return (
      <Badge variant="outline" className="border-destructive text-destructive gap-1">
        <XCircle className="h-3 w-3" />
        Fallido
      </Badge>
    )
  return (
    <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      En curso
    </Badge>
  )
}

function ScopeBadge({ scope }: { scope: BackupRecord["backup_scope"] }) {
  const map = {
    db: { label: "Base de datos", icon: DatabaseBackup },
    images: { label: "Imágenes", icon: Images },
    both: { label: "Completo", icon: HardDrive },
  }
  const { label, icon: Icon } = map[scope]
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

// ─── Progress State ───────────────────────────────────────────────────────────

interface ProgressState {
  running: boolean
  percent: number
  current: number
  total: number
  label: string
  detail: string
  error: string | null
  completed: boolean
}

const INITIAL_PROGRESS: ProgressState = {
  running: false,
  percent: 0,
  current: 0,
  total: 0,
  label: "",
  detail: "",
  error: null,
  completed: false,
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  initialHistory: BackupRecord[]
  initialSettings: BackupSettings
}

export function BackupManager({ initialHistory, initialSettings }: Props) {
  const [history, setHistory] = useState<BackupRecord[]>(initialHistory)
  const [settings, setSettings] = useState<BackupSettings>(initialSettings)
  const [selectedScope, setSelectedScope] = useState<BackupSettings["defaultScope"]>(
    initialSettings.defaultScope,
  )
  const [activeTab, setActiveTab] = useState<"backup" | "settings">("backup")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 6000)
  }

  async function handleRunBackup() {
    setProgress({ ...INITIAL_PROGRESS, running: true, label: "Iniciando backup...", total: 1, current: 0 })

    // Optimistically prepend a running record
    const tempId = `temp-${Date.now()}`
    setHistory((prev) => [
      {
        id: tempId,
        type: "manual",
        backup_scope: selectedScope,
        status: "running",
        created_at: new Date().toISOString(),
      },
      ...prev,
    ])

    try {
      const res = await fetch("/api/backup/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: selectedScope }),
      })

      if (!res.ok || !res.body) {
        const text = await res.text()
        setProgress((p) => ({ ...p, running: false, error: text || "Error al conectar con el servidor" }))
        setHistory((prev) => prev.filter((r) => r.id !== tempId))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? "" // keep incomplete last line

        let currentEvent = ""
        let currentData = ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6).trim()
          } else if (line === "" && currentEvent && currentData) {
            // Dispatch event
            try {
              const payload = JSON.parse(currentData)

              if (currentEvent === "progress") {
                setProgress((p) => ({
                  ...p,
                  running: true,
                  percent: payload.percent,
                  current: payload.current,
                  total: payload.total,
                  label: payload.label,
                }))
              } else if (currentEvent === "detail") {
                setProgress((p) => ({ ...p, detail: payload.message }))
              } else if (currentEvent === "complete") {
                // Replace temp record with the real completed one
                const newRecord: BackupRecord = {
                  id: payload.backupId,
                  type: "manual",
                  backup_scope: selectedScope,
                  status: "completed",
                  blob_url_db: payload.blobUrlDb,
                  blob_url_images: payload.blobUrlImages,
                  file_name_db: payload.fileNameDb,
                  file_name_images: payload.fileNameImages,
                  file_size_db: payload.fileSizeDb,
                  file_size_images: payload.fileSizeImages,
                  tables_count: payload.tablesCount,
                  images_count: payload.imagesCount,
                  created_at: new Date().toISOString(),
                  completed_at: payload.completedAt,
                }
                setHistory((prev) => [newRecord, ...prev.filter((r) => r.id !== tempId)])
                setProgress((p) => ({
                  ...p,
                  running: false,
                  completed: true,
                  percent: 100,
                  label: "Backup completado",
                  detail: "",
                }))
                showMessage("success", `Backup completado. ${payload.tablesCount ? `${payload.tablesCount} tablas` : ""} ${payload.imagesCount ? `· ${payload.imagesCount} imágenes` : ""}`.trim())
              } else if (currentEvent === "error") {
                setHistory((prev) =>
                  prev.map((r) =>
                    r.id === tempId ? { ...r, status: "failed", error_message: payload.message } : r,
                  ),
                )
                setProgress((p) => ({
                  ...p,
                  running: false,
                  error: payload.message,
                }))
              }
            } catch {
              // malformed JSON in SSE — ignore
            }

            currentEvent = ""
            currentData = ""
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de red"
      setProgress((p) => ({ ...p, running: false, error: msg }))
      setHistory((prev) => prev.filter((r) => r.id !== tempId))
    }
  }

  function handleDelete(id: string) {
    deleteBackupRecord(id).then(() => {
      setHistory((prev) => prev.filter((r) => r.id !== id))
    })
  }

  async function handleSaveSettings() {
    setIsSavingSettings(true)
    await saveBackupSettings(settings)
    setIsSavingSettings(false)
    showMessage("success", "Configuración guardada correctamente.")
  }

  return (
    <div className="space-y-6">
      {/* Tab toggle */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("backup")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "backup"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Ejecutar backup
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Configuracion
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Tab: Ejecutar backup ── */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevo backup manual</CardTitle>
              <CardDescription>
                Genera un backup ahora mismo. El archivo se guardara en Vercel Blob y podras
                descargarlo desde el historial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>¿Que incluir en el backup?</Label>
                <Select
                  value={selectedScope}
                  onValueChange={(v) => setSelectedScope(v as BackupSettings["defaultScope"])}
                  disabled={progress.running}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">
                      <span className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Completo (DB + imagenes)
                      </span>
                    </SelectItem>
                    <SelectItem value="db">
                      <span className="flex items-center gap-2">
                        <DatabaseBackup className="h-4 w-4" />
                        Solo base de datos
                      </span>
                    </SelectItem>
                    <SelectItem value="images">
                      <span className="flex items-center gap-2">
                        <Images className="h-4 w-4" />
                        Solo imagenes (ZIP)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleRunBackup} disabled={progress.running} className="gap-2">
                {progress.running ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <HardDrive className="h-4 w-4" />
                )}
                {progress.running ? "Generando backup..." : "Iniciar backup"}
              </Button>

              {/* Progress panel */}
              {(progress.running || progress.completed || progress.error) && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      {progress.running && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {progress.completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {progress.error && <XCircle className="h-4 w-4 text-destructive" />}
                      {progress.label || "Iniciando..."}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {progress.total > 0
                        ? `Paso ${progress.current} de ${progress.total}`
                        : ""}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <Progress
                    value={progress.percent}
                    className={`h-2 ${progress.error ? "[&>div]:bg-destructive" : progress.completed ? "[&>div]:bg-green-500" : ""}`}
                  />

                  {/* Detail message */}
                  {progress.detail && !progress.error && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {progress.detail}
                    </p>
                  )}

                  {/* Error message */}
                  {progress.error && (
                    <p className="text-xs text-destructive leading-relaxed">
                      {progress.error}
                    </p>
                  )}

                  {/* Dismiss when done */}
                  {(progress.completed || progress.error) && (
                    <button
                      onClick={() => setProgress(INITIAL_PROGRESS)}
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                    >
                      Cerrar
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de backups</CardTitle>
              <CardDescription>
                {history.length === 0
                  ? "No hay backups registrados todavia."
                  : `${history.length} backup${history.length !== 1 ? "s" : ""} registrado${history.length !== 1 ? "s" : ""}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <DatabaseBackup className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Todavia no se realizo ningun backup.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-start gap-3"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={record.status} />
                          <ScopeBadge scope={record.backup_scope} />
                          <Badge
                            variant={record.type === "scheduled" ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {record.type === "scheduled" ? (
                              <span className="flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                Programado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Manual
                              </span>
                            )}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <FormattedDate date={record.created_at} showTime />
                          {record.completed_at && (
                            <span>
                              {" "}
                              — completado <FormattedDate date={record.completed_at} showTime />
                            </span>
                          )}
                        </p>
                        {record.status === "completed" && (
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                            {record.tables_count ? <span>{record.tables_count} tablas</span> : null}
                            {record.images_count ? <span>{record.images_count} imagenes</span> : null}
                            {record.file_size_db ? <span>DB: {formatBytes(record.file_size_db)}</span> : null}
                            {record.file_size_images ? <span>ZIP: {formatBytes(record.file_size_images)}</span> : null}
                          </div>
                        )}
                        {record.error_message && (
                          <p className="text-xs text-destructive">{record.error_message}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {record.blob_url_db && (
                          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                            <a
                              href={record.blob_url_db}
                              download={record.file_name_db ?? "backup-db.json"}
                            >
                              <Download className="h-3.5 w-3.5" />
                              DB
                            </a>
                          </Button>
                        )}
                        {record.blob_url_images && (
                          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                            <a
                              href={record.blob_url_images}
                              download={record.file_name_images ?? "backup-images.zip"}
                            >
                              <Download className="h-3.5 w-3.5" />
                              ZIP
                            </a>
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminara el registro del historial. El archivo en Vercel Blob no
                                se borra automaticamente. ¿Confirmas?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(record.id)}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Configuracion ── */}
      {activeTab === "settings" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuracion de backups</CardTitle>
            <CardDescription>
              Ajusta el comportamiento del backup automatico diario y la retencion del historial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Contenido por defecto</Label>
              <Select
                value={settings.defaultScope}
                onValueChange={(v) =>
                  setSettings((s) => ({
                    ...s,
                    defaultScope: v as BackupSettings["defaultScope"],
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Completo (DB + imagenes)</SelectItem>
                  <SelectItem value="db">Solo base de datos</SelectItem>
                  <SelectItem value="images">Solo imagenes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup automatico diario</Label>
                  <p className="text-xs text-muted-foreground">
                    Se ejecuta todos los dias a la hora configurada (UTC).
                  </p>
                </div>
                <Switch
                  checked={settings.cronEnabled}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, cronEnabled: v }))}
                />
              </div>

              {settings.cronEnabled && (
                <div className="space-y-2">
                  <Label>Hora de ejecucion (UTC)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={settings.cronHour}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          cronHour: Math.min(23, Math.max(0, parseInt(e.target.value) || 0)),
                        }))
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">:00 UTC</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Retencion maxima (cantidad de backups)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.retention}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      retention: Math.min(365, Math.max(1, parseInt(e.target.value) || 1)),
                    }))
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  backups (los mas antiguos se eliminan automaticamente)
                </span>
              </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="gap-2">
              {isSavingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar configuracion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
