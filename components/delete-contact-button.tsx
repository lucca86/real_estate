"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import { deleteContact } from "@/lib/actions/contacts"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface DeleteContactButtonProps {
  contactId: string
}

export function DeleteContactButton({ contactId }: DeleteContactButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteContact(contactId)

    if (result.success) {
      toast({
        title: "Contacto eliminado",
        description: "El contacto ha sido eliminado correctamente.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "No se pudo eliminar el contacto.",
        variant: "destructive",
      })
    }

    setIsDeleting(false)
    setOpen(false)
  }

  return (
    <>
      <Button variant="destructive" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El contacto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
