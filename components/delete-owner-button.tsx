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
import { deleteOwner } from "@/lib/actions/owners"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface DeleteOwnerButtonProps {
  ownerId: string
  ownerName?: string
}

export function DeleteOwnerButton({ ownerId, ownerName }: DeleteOwnerButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteOwner(ownerId)
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message || "Propietario procesado correctamente",
        })
        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo procesar la acción",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting owner:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          <span className="sr-only">Eliminar</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar propietario?</AlertDialogTitle>
          <AlertDialogDescription>
            {ownerName && (
              <>
                Se eliminará el propietario <strong>{ownerName}</strong>.
                <br />
                <br />
              </>
            )}
            Si el propietario tiene propiedades asignadas, se marcará como inactivo en lugar de eliminarlo. Si no tiene
            propiedades, se eliminará permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Procesando..." : "Continuar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
