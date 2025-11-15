"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'
import { createUser, updateUser } from "@/lib/actions/users"
import type { SessionUser } from "@/lib/auth"

type User = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "SUPERVISOR" | "VENDEDOR"
  is_active: boolean
}

interface UserFormProps {
  currentUser: SessionUser
  editUser?: User
}

export function UserForm({ currentUser, editUser }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" name="name" defaultValue={editUser?.name} required disabled={isLoading} />
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
