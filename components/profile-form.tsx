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
import { changePassword } from "@/lib/actions/password-reset"
import { toast } from "@/hooks/use-toast"
import { Upload, Loader2, KeyRound } from "lucide-react"
import { Separator } from "@/components/ui/separator"
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
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)

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

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsChangingPassword(true)

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden",
      })
      setIsChangingPassword(false)
      return
    }

    const result = await changePassword(formData)

    if ("error" in result) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    } else {
      toast({
        title: "Contraseña actualizada",
        description: result.message,
      })
      setShowPasswordSection(false)
      ;(e.target as HTMLFormElement).reset()
    }

    setIsChangingPassword(false)
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U"

  return (
    <div className="space-y-6">
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
            <Input
              id="name"
              {...register("name", { required: "El nombre es requerido" })}
              placeholder="Ej: Juan Pérez"
            />
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

      {/* Password Change Section */}
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Cambiar Contraseña</h3>
            <p className="text-sm text-muted-foreground">Actualiza tu contraseña para mantener tu cuenta segura</p>
          </div>
          {!showPasswordSection && (
            <Button type="button" variant="outline" onClick={() => setShowPasswordSection(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Cambiar Contraseña
            </Button>
          )}
        </div>

        {showPasswordSection && (
          <form onSubmit={handlePasswordChange} className="space-y-4 border rounded-lg p-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
                disabled={isChangingPassword}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                disabled={isChangingPassword}
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordSection(false)}
                disabled={isChangingPassword}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
