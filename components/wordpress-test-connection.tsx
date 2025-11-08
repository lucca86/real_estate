"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { testWordPressConnection, debugWordPressProperty } from "@/lib/actions/wordpress"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function WordPressTestConnection() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; user?: any } | null>(null)

  const [debugging, setDebugging] = useState(false)
  const [debugPropertyId, setDebugPropertyId] = useState("46")
  const [debugResult, setDebugResult] = useState<any>(null)

  const handleTest = async () => {
    setTesting(true)
    setResult(null)

    try {
      const response = await testWordPressConnection()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al probar la conexión",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleDebug = async () => {
    setDebugging(true)
    setDebugResult(null)

    try {
      const propertyId = Number.parseInt(debugPropertyId, 10)
      if (isNaN(propertyId)) {
        throw new Error("ID de propiedad inválido")
      }
      const result = await debugWordPressProperty(propertyId)
      setDebugResult(result)
      console.log("[v0] Debug result:", JSON.stringify(result, null, 2))
    } catch (error) {
      setDebugResult({
        error: error instanceof Error ? error.message : "Error al inspeccionar la propiedad",
      })
    } finally {
      setDebugging(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Probar Conexión</h3>
        <Button onClick={handleTest} disabled={testing}>
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {testing ? "Probando conexión..." : "Probar Conexión"}
        </Button>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription className="ml-2 whitespace-pre-line">{result.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-medium">Inspeccionar Propiedad (Debug)</h3>
        <p className="text-sm text-muted-foreground">
          Ingresa el ID de una propiedad demo de WordPress para ver qué meta fields usa Major Estatik
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="ID de propiedad (ej: 46)"
            value={debugPropertyId}
            onChange={(e) => setDebugPropertyId(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleDebug} disabled={debugging || !debugPropertyId}>
            {debugging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {debugging ? "Inspeccionando..." : "Inspeccionar"}
          </Button>
        </div>

        {debugResult && (
          <div className="rounded-lg border bg-muted p-4">
            <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(debugResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
