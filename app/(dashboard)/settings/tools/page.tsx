import { getCurrentUser, isAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getBackupHistory, getBackupSettings } from "@/lib/actions/backup"
import { BackupManager } from "@/components/backup-manager"
import { DatabaseBackup } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata = {
  title: "Herramientas — Configuración",
  description: "Backup de base de datos e imágenes",
}

export default async function ToolsPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")
  if (!isAdmin(user)) redirect("/dashboard")

  const [history, settings] = await Promise.all([
    getBackupHistory(50),
    getBackupSettings(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mt-0.5">
          <Link href="/settings" className="flex items-center gap-1.5 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Configuración
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <DatabaseBackup className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Herramientas</h1>
          <p className="text-sm text-muted-foreground">
            Backup de base de datos e imágenes. Solo visible para administradores.
          </p>
        </div>
      </div>

      {/* Backup manager */}
      <BackupManager initialHistory={history} initialSettings={settings} />
    </div>
  )
}
