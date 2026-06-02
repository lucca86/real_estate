import { getCurrentUser, isAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getBackupHistory, getBackupSettings } from "@/lib/actions/backup"
import { BackupManager } from "@/components/backup-manager"
import { WordPressAddressDebug } from "@/components/wordpress-address-debug"
import { DatabaseBackup } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Herramientas — Configuración",
  description: "Backup de base de datos e imágenes",
}

export default async function ToolsPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")
  if (!isAdmin(user)) redirect("/dashboard")

  const supabase = createClient()

  const [history, settings, wpPropertiesRes] = await Promise.all([
    getBackupHistory(50),
    getBackupSettings(),
    supabase
      .from("properties")
      .select("wordpress_id, title")
      .not("wordpress_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(5),
  ])

  const wpProperties = (wpPropertiesRes.data ?? []).map((p) => ({
    wpId: p.wordpress_id as number,
    title: p.title,
  }))

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

      {/* WordPress address debug */}
      {wpProperties.length > 0 && (
        <WordPressAddressDebug wordpressIds={wpProperties} />
      )}
    </div>
  )
}
