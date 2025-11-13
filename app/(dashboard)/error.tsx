"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Dashboard Error:", error)
  }, [error])

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Algo salió mal</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "Hubo un problema al cargar esta página."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => reset()}>Intentar de nuevo</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
