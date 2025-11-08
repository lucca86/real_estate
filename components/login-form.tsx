"use client"

import * as React from "react"
import { signIn } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function LoginForm() {
  const [error, setError] = React.useState<string | null>(null)
  const [requiresTwoFactor, setRequiresTwoFactor] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const result = await signIn(formData)

      if (result?.error) {
        setError(result.error)
        if (result.requiresTwoFactor) {
          setRequiresTwoFactor(true)
        }
      } else if (result?.requiresTwoFactor) {
        setRequiresTwoFactor(true)
      }
    } catch (err) {
      setError("Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
        <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pb-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="tu@email.com" required disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required disabled={isLoading} />
          </div>

          {requiresTwoFactor && (
            <div className="space-y-2">
              <Label htmlFor="twoFactorCode">Código de Autenticación</Label>
              <Input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                placeholder="000000"
                maxLength={6}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el código de 6 dígitos de tu aplicación de autenticación
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Sesión
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
