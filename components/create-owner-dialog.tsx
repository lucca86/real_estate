"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { createOwner } from "@/lib/actions/owners"
import { useToast } from "@/hooks/use-toast"

interface CreateOwnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOwnerCreated: (owner: { id: string; name: string }) => void
}

export function CreateOwnerDialog({ open, onOpenChange, onOwnerCreated }: CreateOwnerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await createOwner(formData)

      if (result.success && result.owner) {
        onOwnerCreated(result.owner)
        onOpenChange(false)
        ;(event.target as HTMLFormElement).reset()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo crear el propietario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el propietario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Propietario</DialogTitle>
            <DialogDescription>Ingresa los datos básicos del propietario para agregarlo rápidamente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input id="name" name="name" required disabled={isLoading} placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                disabled={isLoading}
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" name="phone" type="tel" required disabled={isLoading} placeholder="+1 (809) 555-1234" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Propietario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
