"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
  triggerBackup,
  saveBackupSettings,
  deleteBackupRecord,
  type BackupRecord,
  type BackupSettings,
} from "@/lib/actions/backup"
import { FormattedDate } from "@/components/formatted-date"
import { formatBytes } from "@/lib/utils"

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const [isPending, startTransition] = useTransition()
  const [isSavingSettings, startSavingSettings] = useTransition()

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  function handleRunBackup() {
    startTransition(async () => {
      const result = await triggerBackup(selectedScope)
      if (result.success) {
        showMessage("success", "Backup iniciado correctamente. Aparecerá en el historial al completarse.")
        // Optimistically add a "running" record to history
        setHistory((prev) => [
          {
            id: result.backupId ?? crypto.randomUUID(),
            type: "manual",
            backup_scope: selectedScope,
            status: "running",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        showMessage("error", result.error ?? "Error al iniciar el backup")
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBackupRecord(id)
      setHistory((prev) => prev.filter((r) => r.id !== id))
    })
  }

  function handleSaveSettings() {
    startSavingSettings(async () => {
      await saveBackupSettings(settings)
      showMessage("success", "Configuración guardada correctamente.")
    })
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
          Configuración
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Tab: Ejecutar backup ── */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          {/* Run backup card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevo backup manual</CardTitle>
              <CardDescription>
                Genera un backup ahora mismo. El archivo se guardará en Vercel Blob y podrás
                descargarlo desde el historial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>¿Qué incluir en el backup?</Label>
                <Select
                  value={selectedScope}
                  onValueChange={(v) => setSelectedScope(v as BackupSettings["defaultScope"])}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">
                      <span className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Completo (DB + imágenes)
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
                        Solo imágenes (ZIP)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  El backup de imágenes descarga todas las fotos de propiedades y las empaqueta en
                  un archivo ZIP organizado por propiedad.
                </p>
              </div>

              <Button onClick={handleRunBackup} disabled={isPending} className="gap-2">
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <HardDrive className="h-4 w-4" />
                )}
                {isPending ? "Generando backup..." : "Iniciar backup"}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de backups</CardTitle>
              <CardDescription>
                {history.length === 0
                  ? "No hay backups registrados todavía."
                  : `${history.length} backup${history.length !== 1 ? "s" : ""} registrado${history.length !== 1 ? "s" : ""}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <DatabaseBackup className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Todavía no se realizó ningún backup.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((record) => (
                    <div key={record.id} className="py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={record.status} />
                          <ScopeBadge scope={record.backup_scope} />
                          <Badge variant={record.type === "scheduled" ? "secondary" : "outline"} className="text-xs">
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
                              {" "}— completado <FormattedDate date={record.completed_at} showTime />
                            </span>
                          )}
                        </p>
                        {record.status === "completed" && (
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
                            {record.tables_count && (
                              <span>{record.tables_count} tablas</span>
                            )}
                            {record.images_count && (
                              <span>{record.images_count} imágenes</span>
                            )}
                            {record.file_size_db && (
                              <span>DB: {formatBytes(record.file_size_db)}</span>
                            )}
                            {record.file_size_images && (
                              <span>ZIP: {formatBytes(record.file_size_images)}</span>
                            )}
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
                            <a href={record.blob_url_db} download={record.file_name_db ?? "backup-db.json"}>
                              <Download className="h-3.5 w-3.5" />
                              DB
                            </a>
                          </Button>
                        )}
                        {record.blob_url_images && (
                          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                            <a href={record.blob_url_images} download={record.file_name_images ?? "backup-images.zip"}>
                              <Download className="h-3.5 w-3.5" />
                              ZIP
                            </a>
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar registro</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminará el registro del historial. El archivo en Vercel Blob
                                no se borra automáticamente. ¿Confirmas?
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

      {/* ── Tab: Configuración ── */}
      {activeTab === "settings" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración de backups</CardTitle>
            <CardDescription>
              Ajustá el comportamiento del backup automático diario y la retención del historial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default scope */}
            <div className="space-y-2">
              <Label>Contenido por defecto</Label>
              <Select
                value={settings.defaultScope}
                onValueChange={(v) =>
                  setSettings((s) => ({ ...s, defaultScope: v as BackupSettings["defaultScope"] }))
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Completo (DB + imágenes)</SelectItem>
                  <SelectItem value="db">Solo base de datos</SelectItem>
                  <SelectItem value="images">Solo imágenes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Daily cron */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup automático diario</Label>
                  <p className="text-xs text-muted-foreground">
                    Se ejecuta todos los días a la hora configurada (UTC).
                  </p>
                </div>
                <Switch
                  checked={settings.cronEnabled}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, cronEnabled: v }))}
                />
              </div>

              {settings.cronEnabled && (
                <div className="space-y-2">
                  <Label>Hora de ejecución (UTC)</Label>
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

            {/* Retention */}
            <div className="space-y-2">
              <Label>Retención máxima (cantidad de backups)</Label>
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
                  backups (los más antiguos se eliminan automáticamente)
                </span>
              </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="gap-2">
              {isSavingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar configuración
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
