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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ownerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es requerido"),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  cityId: z.string().optional(),
  provinceId: z.string().optional(),
  countryId: z.string().min(1, "El país es requerido"),
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
    secondary_phone: string | null
    address: string | null
    city_id: string | null
    province_id: string | null
    country_id: string | null
    id_number: string | null
    tax_id: string | null
    notes: string | null
    is_active: boolean
  }
  countries?: Array<{ id: string; name: string }>
  provinces?: Array<{ id: string; name: string; country_id: string }>
  cities?: Array<{ id: string; name: string; province_id: string }>
}

export function OwnerForm({ owner, countries = [], provinces = [], cities = [] }: OwnerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState(owner?.country_id || "")
  const [selectedProvinceId, setSelectedProvinceId] = useState(owner?.province_id || "")
  const [selectedProvinceName, setSelectedProvinceName] = useState("")
  const [selectedCityName, setSelectedCityName] = useState("")

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
      secondaryPhone: owner?.secondary_phone || "",
      address: owner?.address || "",
      cityId: owner?.city_id || "",
      provinceId: owner?.province_id || "",
      countryId: owner?.country_id || "",
      idNumber: owner?.id_number || "",
      taxId: owner?.tax_id || "",
      notes: owner?.notes || "",
      isActive: owner?.is_active ?? true,
    },
  })

  const isActive = watch("isActive")
  const cityId = watch("cityId")

  const handleCountryChange = (value: string) => {
    setSelectedCountryId(value)
    setValue("countryId", value)
    setSelectedProvinceId("")
    setValue("provinceId", "")
    setValue("cityId", "")
    setSelectedProvinceName("")
    setSelectedCityName("")
  }

  const handleProvinceChange = (value: string) => {
    setSelectedProvinceName(value)
    setValue("provinceId", value)
    setSelectedProvinceId(value)
    setValue("cityId", "")
    setSelectedCityName("")
  }

  const handleCityChange = (value: string) => {
    setSelectedCityName(value)
    setValue("cityId", value)
  }

  const onSubmit = async (data: OwnerFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("name", data.name)
      if (data.email) formData.append("email", data.email)
      formData.append("phone", data.phone)
      formData.append("countryId", data.countryId)
      formData.append("isActive", String(data.isActive))

      if (data.secondaryPhone) formData.append("secondaryPhone", data.secondaryPhone)
      if (data.address) formData.append("address", data.address)
      if (data.cityId) formData.append("cityId", data.cityId)
      if (data.provinceId) formData.append("provinceId", data.provinceId)
      if (data.idNumber) formData.append("idNumber", data.idNumber)
      if (data.taxId) formData.append("taxId", data.taxId)
      if (data.notes) formData.append("notes", data.notes)

      const result = owner ? await updateOwner(owner.id, data) : await createOwner(formData)

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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="taxId">CUIL/CUIT</Label>
              <Input id="taxId" {...register("taxId")} placeholder="20-12345678-9" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" {...register("address")} placeholder="Ingrese la dirección..." />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="countryId">
                País <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedCountryId} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.countryId && <p className="text-sm text-destructive">{errors.countryId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="provinceId">Provincia/Estado</Label>
              <Select
                name="provinceId"
                value={selectedProvinceId}
                onValueChange={handleProvinceChange}
                disabled={!selectedCountryId || selectedCountryId !== "argentina-id"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escriba para buscar provincia..." />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId">Ciudad</Label>
              <Select name="cityId" value={cityId} onValueChange={handleCityChange} disabled={!selectedProvinceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escriba para buscar ciudad..." />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
