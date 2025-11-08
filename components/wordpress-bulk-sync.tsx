"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Cloud, Loader2 } from "lucide-react"
import { syncAllPropertiesToWordPress } from "@/lib/actions/wordpress"

export function WordPressBulkSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setResult(null)

    try {
      const syncResult = await syncAllPropertiesToWordPress()
      setResult(syncResult)
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : "Error desconocido"],
      })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cloud className="mr-2 h-4 w-4" />}
        {isSyncing ? "Sincronizando..." : "Sincronizar Todas las Propiedades"}
      </Button>

      {result && (
        <div className="space-y-2">
          <Alert variant={result.failed > 0 ? "destructive" : "default"}>
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Exitosas:</strong> {result.success}
                </p>
                <p>
                  <strong>Fallidas:</strong> {result.failed}
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Errores:</p>
                    <ul className="ml-4 list-disc text-sm">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
          {result.success > 0 && result.failed === 0 && <Progress value={100} className="h-2" />}
        </div>
      )}
    </div>
  )
}
