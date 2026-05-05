"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Cloud, CloudOff, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { syncPropertyToWordPress, deletePropertyFromWordPress } from "@/lib/actions/wordpress"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { FormattedDate } from "@/components/formatted-date"

type SyncResult = {
  success: boolean
  wordpressId: number | null
  warning?: string
}

interface WordPressSyncButtonProps {
  propertyId: string
  wordpressId: number | null
  syncedAt: Date | null
  hasImagesToSync?: boolean
}

export function WordPressSyncButton({
  propertyId,
  wordpressId,
  syncedAt,
  hasImagesToSync = false,
}: WordPressSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const result = (await syncPropertyToWordPress(propertyId)) as SyncResult

      if (result.warning) {
        toast({
          title: "No se pudo sincronizar",
          description: result.warning,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sincronización exitosa",
        description: `Propiedad sincronizada con WordPress (ID: ${result.wordpressId})`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description: error instanceof Error ? error.message : "Error al sincronizar",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePropertyFromWordPress(propertyId)
      toast({
        title: "Eliminación exitosa",
        description: "Propiedad eliminada de WordPress",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error al eliminar",
        description: error instanceof Error ? error.message : "Error al eliminar",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {wordpressId ? (
        <>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
            <Cloud className="mr-1 h-3 w-3" />
            Sincronizado
          </Badge>
          {syncedAt && (
            <FormattedDate date={syncedAt} showTime className="text-xs text-muted-foreground" />
          )}
          {!hasImagesToSync && (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
              <AlertCircle className="mr-1 h-3 w-3" />
              Sin imágenes seleccionadas
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudOff className="mr-2 h-4 w-4" />}
                Desincronizar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Desincronizar de WordPress?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la propiedad de WordPress pero se mantendrá en el sistema local.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Desincronizar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
            <CloudOff className="mr-1 h-3 w-3" />
            No sincronizado
          </Badge>
          {!hasImagesToSync && (
            <Badge variant="secondary" className="bg-red-500/10 text-red-500">
              <AlertCircle className="mr-1 h-3 w-3" />
              Sin imágenes seleccionadas
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cloud className="mr-2 h-4 w-4" />}
            Sincronizar
          </Button>
        </>
      )}
    </div>
  )
}
