"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile } from "@/lib/actions/users"
import { toast } from "@/hooks/use-toast"
import { Upload, Loader2 } from "lucide-react"
import type { SessionUser } from "@/lib/auth"

interface ProfileFormProps {
  user: SessionUser
}

interface ProfileFormData {
  name: string
  email: string
  avatar?: FileList
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true)

      const formData = new FormData()
      formData.append("id", user.id)
      formData.append("name", data.name)
      formData.append("email", data.email)
      formData.append("role", user.role)
      formData.append("is_active", "true")

      if (data.avatar && data.avatar[0]) {
        formData.append("avatar", data.avatar[0])
      }

      const result = await updateProfile(formData)

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
        return
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información se ha actualizado correctamente",
      })

      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al actualizar el perfil",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 pb-6 border-b">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarPreview || undefined} alt={user.name} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-center gap-2">
          <Label htmlFor="avatar" className="cursor-pointer">
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
              <Upload className="h-4 w-4" />
              <span>Cambiar foto</span>
            </div>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              {...register("avatar")}
              onChange={handleAvatarChange}
            />
          </Label>
          <p className="text-xs text-muted-foreground">JPG, PNG o GIF (máx. 5MB)</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input id="name" {...register("name", { required: "El nombre es requerido" })} placeholder="Ej: Juan Pérez" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email", {
              required: "El email es requerido",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido",
              },
            })}
            placeholder="ejemplo@correo.com"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label>Rol</Label>
          <Input value={user.role} disabled className="bg-muted" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
