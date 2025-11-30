"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { createContact, updateContact } from "@/lib/actions/contacts"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Service {
  id: string
  name: string
}

interface ContactFormProps {
  services: Service[]
  contact?: any
}

export function ContactForm({ services, contact }: ContactFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>(
    contact?.services?.map((cs: any) => cs.service.id) || [],
  )

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      company: contact?.company || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      address: contact?.address || "",
      website: contact?.website || "",
      notes: contact?.notes || "",
      isActive: contact?.isActive ?? true,
    },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
    formData.append("serviceIds", JSON.stringify(selectedServices))

    const result = contact ? await updateContact(contact.id, formData) : await createContact(formData)

    if (result.success) {
      toast({
        title: contact ? "Contacto actualizado" : "Contacto creado",
        description: `El contacto ha sido ${contact ? "actualizado" : "creado"} correctamente.`,
      })
      router.push("/contacts")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Ocurrió un error al guardar el contacto.",
        variant: "destructive",
      })
    }

    setIsSubmitting(false)
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-lg font-semibold">Información Personal</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                {...register("firstName", { required: "El nombre es requerido" })}
                placeholder="Juan"
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido *</Label>
              <Input
                id="lastName"
                {...register("lastName", { required: "El apellido es requerido" })}
                placeholder="Pérez"
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message as string}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" {...register("company")} placeholder="Nombre de la empresa" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-lg font-semibold">Información de Contacto</h2>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} placeholder="ejemplo@email.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Celular *</Label>
            <Input
              id="phone"
              {...register("phone", { required: "El celular es requerido" })}
              placeholder="+54 9 11 1234-5678"
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message as string}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register("address")} placeholder="Ingrese la dirección..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Sitio Web</Label>
            <Input id="website" {...register("website")} placeholder="https://ejemplo.com" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-lg font-semibold">Servicios</h2>
          <p className="text-sm text-muted-foreground">Selecciona los servicios que ofrece este contacto</p>

          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => (
              <div key={service.id} className="flex items-center space-x-2">
                <Checkbox
                  id={service.id}
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                />
                <Label htmlFor={service.id} className="text-sm font-normal cursor-pointer">
                  {service.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-lg font-semibold">Notas</h2>

          <div className="space-y-2">
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observaciones o información adicional..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" {...register("isActive")} defaultChecked={contact?.isActive ?? true} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Contacto activo
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {contact ? "Actualizar Contacto" : "Crear Contacto"}
        </Button>
      </div>
    </form>
  )
}
