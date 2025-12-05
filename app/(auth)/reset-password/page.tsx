import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import Link from "next/link"
import { ResetPasswordForm } from "@/components/reset-password-form"

export const metadata: Metadata = {
  title: "Restablecer Contraseña",
  description: "Crea una nueva contraseña para tu cuenta",
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  if (!searchParams.token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-bold">Token Inválido</h1>
          <p className="text-muted-foreground">El enlace de recuperación no es válido o ha expirado</p>
          <Link href="/forgot-password">
            <Button>Solicitar Nuevo Enlace</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Restablecer Contraseña</h1>
          <p className="text-muted-foreground">Ingresa tu nueva contraseña</p>
        </div>

        <ResetPasswordForm token={searchParams.token} />

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
