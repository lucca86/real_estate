"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { Trash2, Loader2 } from "lucide-react"
import { deleteProperty } from "@/lib/actions/properties"
import { useRouter } from "next/navigation"

interface DeletePropertyButtonProps {
  propertyId: string
  propertyTitle: string
}

export function DeletePropertyButton({ propertyId, propertyTitle }: DeletePropertyButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProperty(propertyId)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting property:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          <span className="sr-only">Eliminar</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">⚠️ Eliminar Propiedad Definitivamente</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold text-foreground">
              Esta acción eliminará permanentemente la propiedad <strong className="text-destructive">"{propertyTitle}"</strong> de:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Sistema de gestión local</li>
              <li>WordPress (si está sincronizada)</li>
              <li>Todas las imágenes asociadas</li>
            </ul>
            <p className="font-bold text-destructive bg-destructive/10 p-3 rounded-md">
              NO HAY FORMA DE RECUPERAR ESTA PROPIEDAD una vez eliminada.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sí, Eliminar Definitivamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
