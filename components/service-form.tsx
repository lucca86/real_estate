"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createService, updateService } from "@/lib/actions/services"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface ServiceFormProps {
  service?: any
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      isActive: service?.isActive ?? true,
    },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    const result = service ? await updateService(service.id, formData) : await createService(formData)

    if (result.success) {
      toast({
        title: service ? "Servicio actualizado" : "Servicio creado",
        description: `El servicio ha sido ${service ? "actualizado" : "creado"} correctamente.`,
      })
      router.push("/services")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Ocurrió un error al guardar el servicio.",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Servicio *</Label>
          <Input
            id="name"
            {...register("name", { required: "El nombre es requerido" })}
            placeholder="Plomería, Electricidad, Abogado, etc."
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Breve descripción del servicio..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="isActive" {...register("isActive")} defaultChecked={service?.isActive ?? true} />
          <Label htmlFor="isActive" className="cursor-pointer">
            Servicio activo
          </Label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {service ? "Actualizar Servicio" : "Crear Servicio"}
        </Button>
      </div>
    </form>
  )
}
