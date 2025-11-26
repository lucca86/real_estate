"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, X } from "lucide-react"
import { createUser, updateUser } from "@/lib/actions/users"
import type { SessionUser } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type User = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "SUPERVISOR" | "VENDEDOR"
  is_active: boolean
  avatar?: string | null
}

interface UserFormProps {
  currentUser: SessionUser
  editUser?: User
}

export function UserForm({ currentUser, editUser }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(editUser?.avatar || null)

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null)
    const fileInput = document.getElementById("avatar") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      if (editUser) {
        await updateUser(editUser.id, formData)
      } else {
        await createUser(formData)
      }
      router.push("/users")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error")
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
          <CardDescription>Completa los datos del usuario</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-lg">{editUser ? getInitials(editUser.name) : "NU"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">Foto de perfil</Label>
              <div className="flex gap-2">
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
                {avatarPreview && (
                  <Button type="button" variant="outline" size="icon" onClick={handleRemoveAvatar} disabled={isLoading}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Formatos: JPG, PNG, GIF (máx. 2MB)</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editUser?.name}
                placeholder="Ej: Juan Pérez"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editUser?.email}
                required
                disabled={isLoading}
              />
            </div>

            {!editUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required disabled={isLoading} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                name="role"
                defaultValue={editUser?.role || "VENDEDOR"}
                disabled={isLoading || currentUser.role !== "ADMIN"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  {currentUser.role === "ADMIN" && <SelectItem value="ADMIN">Administrador</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Usuario Activo</Label>
              <p className="text-sm text-muted-foreground">El usuario puede acceder al sistema</p>
            </div>
            <Switch id="isActive" name="isActive" defaultChecked={editUser?.is_active ?? true} disabled={isLoading} />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editUser ? "Actualizar" : "Crear"} Usuario
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
