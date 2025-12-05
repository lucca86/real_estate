import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export const metadata: Metadata = {
  title: "Recuperar Contraseña",
  description: "Solicita un enlace para restablecer tu contraseña",
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Recuperar Contraseña</h1>
          <p className="text-muted-foreground">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
