"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createOwner, updateOwner, deleteOwner } from "@/lib/actions/owners"
import { Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
import { Switch } from "@/components/ui/switch"

const ownerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().min(1, "El país es requerido"),
  idNumber: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
})

type OwnerFormData = z.infer<typeof ownerSchema>

interface OwnerFormProps {
  owner?: {
    id: string
    name: string
    email: string
    phone: string
    secondaryPhone: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string
    idNumber: string | null
    taxId: string | null
    notes: string | null
    isActive: boolean
  }
}

export function OwnerForm({ owner }: OwnerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      name: owner?.name || "",
      email: owner?.email || "",
      phone: owner?.phone || "",
      secondaryPhone: owner?.secondaryPhone || "",
      address: owner?.address || "",
      city: owner?.city || "",
      state: owner?.state || "",
      country: owner?.country || "",
      idNumber: owner?.idNumber || "",
      taxId: owner?.taxId || "",
      notes: owner?.notes || "",
      isActive: owner?.isActive ?? true,
    },
  })

  const isActive = watch("isActive")

  const onSubmit = async (data: OwnerFormData) => {
    setIsSubmitting(true)
    try {
      const result = owner ? await updateOwner(owner.id, data) : await createOwner(data)

      if (result.success) {
        toast({
          title: owner ? "Propietario actualizado" : "Propietario creado",
          description: owner ? "Los cambios se guardaron correctamente" : "El propietario se registró correctamente",
        })
        router.push("/owners")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar el propietario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el propietario",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!owner) return
    setIsDeleting(true)
    try {
      const result = await deleteOwner(owner.id)
      if (result.success) {
        toast({
          title: "Propietario eliminado",
          description: "El propietario se eliminó correctamente",
        })
        router.push("/owners")
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el propietario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el propietario",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre Completo <span className="text-destructive">*</span>
            </Label>
            <Input id="name" {...register("name")} placeholder="Juan Pérez" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" {...register("email")} placeholder="juan@example.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-destructive">*</span>
              </Label>
              <Input id="phone" {...register("phone")} placeholder="+54 379 123-4567" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryPhone">Teléfono Secundario</Label>
            <Input id="secondaryPhone" {...register("secondaryPhone")} placeholder="+54 379 987-6543" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="idNumber">Cédula/DNI</Label>
              <Input id="idNumber" {...register("idNumber")} placeholder="12345678" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">RNC/Número Fiscal</Label>
              <Input id="taxId" {...register("taxId")} placeholder="123-45678-9" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register("address")} placeholder="Calle 123, Ciudad" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" {...register("city")} placeholder="Corrientes" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Provincia/Estado</Label>
              <Input id="state" {...register("state")} placeholder="Corrientes" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                País <span className="text-destructive">*</span>
              </Label>
              <Input id="country" {...register("country")} placeholder="Argentina" />
              {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Información adicional sobre el propietario"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">
                Estado Activo <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">Desactiva este propietario si ya no está en el sistema</p>
            </div>
            <Switch id="isActive" checked={isActive} onCheckedChange={(checked) => setValue("isActive", checked)} />
            {errors.isActive && <p className="text-sm text-destructive">{errors.isActive.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {owner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el propietario permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/owners")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {owner ? "Guardar Cambios" : "Crear Propietario"}
          </Button>
        </div>
      </div>
    </form>
  )
}
