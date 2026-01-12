"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Loader2 } from "lucide-react"
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
import { deleteAppointment } from "@/lib/actions/appointments"
import { useToast } from "@/hooks/use-toast"

interface DeleteAppointmentButtonProps {
  appointmentId: string
  clientName: string
  propertyTitle?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  canDelete?: boolean
}

export function DeleteAppointmentButton({
  appointmentId,
  clientName,
  propertyTitle,
  variant = "destructive",
  size = "icon",
  canDelete = false, // Default to false
}: DeleteAppointmentButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteAppointment(appointmentId)

      if (result.success) {
        toast({
          title: "Cita eliminada",
          description: "La cita ha sido eliminada exitosamente",
        })
        setIsOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la cita",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!canDelete) {
    return null
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size={size} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {size !== "icon" && <span className="ml-2">Eliminar</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la cita con <strong>{clientName}</strong>
            {propertyTitle && (
              <>
                {" "}
                para ver <strong>{propertyTitle}</strong>
              </>
            )}
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
