"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ownerSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  ownerType: z.enum(["Propietario", "Apoderado", "Intermediario"]),
  realEstateAgency: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().min(1, "El teléfono es requerido"),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  cityId: z.string().min(1, "La ciudad es requerida"),
  provinceId: z.string().min(1, "La provincia es requerida"),
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
    first_name?: string | null
    last_name?: string | null
    owner_type?: string | null
    real_estate_agency?: string | null
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
  provinces?: Array<{ id: string; name: string; country_id: string; country?: { id: string; name: string } }>
  cities?: Array<{ id: string; name: string; province_id: string; province?: { id: string; name: string } }>
}

const capitalizeFirst = (str: string) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function OwnerForm({ owner, countries = [], provinces = [], cities = [] }: OwnerFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Find Argentina ID dynamically from the countries list
  const argentinaCountry = countries.find((c) => c.name === "Argentina")
  const defaultCountryId = argentinaCountry?.id || ""
  
  // Find default province (Corrientes) and city
  const defaultProvince = provinces.find((p) => p.name === "Corrientes" && p.country_id === defaultCountryId)
  const defaultProvinceId = defaultProvince?.id || ""
  
  const defaultCity = cities.find((c) => c.name === "Corrientes" && c.province_id === defaultProvinceId)
  const defaultCityId = defaultCity?.id || ""

  const [selectedCountryId, setSelectedCountryId] = useState(owner?.country_id || defaultCountryId)
  const [selectedProvinceId, setSelectedProvinceId] = useState(owner?.province_id || defaultProvinceId)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      firstName: owner?.first_name || owner?.name?.split(" ")[0] || "",
      lastName: owner?.last_name || owner?.name?.split(" ").slice(1).join(" ") || "",
      ownerType: (owner?.owner_type as "Propietario" | "Apoderado" | "Intermediario") || "Propietario",
      realEstateAgency: owner?.real_estate_agency || "",
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

  useEffect(() => {
    if (!owner && defaultCountryId) {
      // For new owners, ensure default values are set
      setValue("countryId", defaultCountryId)
      setSelectedCountryId(defaultCountryId)
      
      if (defaultProvinceId) {
        setValue("provinceId", defaultProvinceId)
        setSelectedProvinceId(defaultProvinceId)
      }
      
      if (defaultCityId) {
        setValue("cityId", defaultCityId)
      }
    }
  }, [defaultCountryId, defaultProvinceId, defaultCityId, owner, setValue])

  const isActive = watch("isActive")
  const cityId = watch("cityId")
  const countryId = watch("countryId")

  const handleCountryChange = (value: string) => {
    setSelectedCountryId(value)
    setValue("countryId", value)
    setSelectedProvinceId("")
    setValue("provinceId", "")
    setValue("cityId", "")
  }

  const handleProvinceChange = (value: string) => {
    setValue("provinceId", value)
    setSelectedProvinceId(value)
    setValue("cityId", "")
  }

  const handleCityChange = (value: string) => {
    setValue("cityId", value)
  }

  const filteredProvinces = provinces.filter((p) => p.country_id === selectedCountryId)
  const filteredCities = cities.filter((c) => c.province_id === selectedProvinceId)

  const provincesByCountry = provinces.reduce(
    (acc, province) => {
      const countryName =
        province.country?.name || countries.find((c) => c.id === province.country_id)?.name || "Sin país"
      if (!acc[countryName]) {
        acc[countryName] = []
      }
      acc[countryName].push(province)
      return acc
    },
    {} as Record<string, typeof provinces>,
  )

  const citiesByProvince = filteredCities.reduce(
    (acc, city) => {
      const provinceName =
        city.province?.name || provinces.find((p) => p.id === city.province_id)?.name || "Sin provincia"
      if (!acc[provinceName]) {
        acc[provinceName] = []
      }
      acc[provinceName].push(city)
      return acc
    },
    {} as Record<string, typeof filteredCities>,
  )

  const onSubmit = async (data: OwnerFormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("firstName", capitalizeFirst(data.firstName))
      formData.append("lastName", capitalizeFirst(data.lastName))
      formData.append("ownerType", data.ownerType)
      if (data.realEstateAgency) formData.append("realEstateAgency", data.realEstateAgency)
      if (data.email) formData.append("email", data.email)
      formData.append("phone", data.phone)
      if (data.countryId) formData.append("countryId", data.countryId)
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="Juan"
                onChange={(e) => {
                  setValue("firstName", capitalizeFirst(e.target.value))
                }}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Apellido <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Pérez"
                onChange={(e) => {
                  setValue("lastName", capitalizeFirst(e.target.value))
                }}
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerType">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("ownerType")}
              onValueChange={(value) => setValue("ownerType", value as "Propietario" | "Apoderado" | "Intermediario")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Propietario">Propietario</SelectItem>
                <SelectItem value="Apoderado">Apoderado</SelectItem>
                <SelectItem value="Intermediario">Intermediario</SelectItem>
              </SelectContent>
            </Select>
            {errors.ownerType && <p className="text-sm text-destructive">{errors.ownerType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="realEstateAgency">Inmobiliaria de referencia</Label>
            <Input id="realEstateAgency" {...register("realEstateAgency")} placeholder="Nombre de la inmobiliaria" />
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
              <Label htmlFor="provinceId">
                Provincia/Estado <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedProvinceId} onValueChange={handleProvinceChange} disabled={!selectedCountryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar provincia..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(provincesByCountry).map(([countryName, countryProvinces]) => (
                    <SelectGroup key={countryName}>
                      <SelectLabel className="text-xs font-semibold text-primary">🌎 {countryName}</SelectLabel>
                      {countryProvinces.map((province) => (
                        <SelectItem key={province.id} value={province.id} className="pl-6">
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {errors.provinceId && <p className="text-sm text-destructive">{errors.provinceId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId">
                Ciudad <span className="text-destructive">*</span>
              </Label>
              <Select value={cityId} onValueChange={handleCityChange} disabled={!selectedProvinceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ciudad..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(citiesByProvince).map(([provinceName, provinceCities]) => (
                    <SelectGroup key={provinceName}>
                      <SelectLabel className="text-xs font-semibold text-primary">📍 {provinceName}</SelectLabel>
                      {provinceCities.map((city) => (
                        <SelectItem key={city.id} value={city.id} className="pl-6">
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {errors.cityId && <p className="text-sm text-destructive">{errors.cityId.message}</p>}
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
