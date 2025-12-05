"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"
import { resetPassword } from "@/lib/actions/password-reset"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Loader2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Actualizando...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Restablecer Contraseña
        </>
      )}
    </Button>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setMessage(null)
    formData.append("token", token)

    const result = await resetPassword(formData)

    if ("error" in result) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: result.message || "Contraseña actualizada" })
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <Label htmlFor="password">Nueva Contraseña</Label>
        <Input id="password" name="password" type="password" placeholder="Mínimo 6 caracteres" required minLength={6} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Repite tu contraseña"
          required
          minLength={6}
        />
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  )
}
