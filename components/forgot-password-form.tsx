"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { requestPasswordReset } from "@/lib/actions/password-reset"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Enviar Enlace de Recuperación
        </>
      )}
    </Button>
  )
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    setResetUrl(null)

    const result = await requestPasswordReset(formData)

    if ("error" in result) {
      setMessage({ type: "error", text: result.error })
    } else if ("success" in result && result.success) {
      setMessage({
        type: "success",
        text: result.message ?? "Enlace enviado exitosamente",
      })

      // Show reset URL in development mode
      if (result.resetUrl) {
        setResetUrl(result.resetUrl)
      }
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="tu@email.com" required />
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {resetUrl && (
        <Alert>
          <AlertDescription className="space-y-2">
            <p className="font-semibold">Modo desarrollo - Enlace de recuperación:</p>
            <a href={resetUrl} className="block break-all text-xs text-primary hover:underline">
              {resetUrl}
            </a>
          </AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  )
}
