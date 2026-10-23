"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bug, CheckCircle, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

interface DebugResult {
  propertyId: number
  title: string
  usedEndpoint: string
  taxonomyStatus: Record<string, { exists: boolean; hasValue: boolean; value: string }>
  ourKeysStatus: Record<string, { exists: boolean; hasValue: boolean; value: string }>
  allMetaKeys: string[]
  issues: string[]
  recommendations: Record<string, string>
  rawTopLevelKeys: string[]
  rawData: any
}

export function WordPressAddressDebug({ wordpressIds }: { wordpressIds: { wpId: number; title: string }[] }) {
  const [results, setResults] = useState<DebugResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showAllKeys, setShowAllKeys] = useState(false)

  async function runDebug() {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const debugResults: DebugResult[] = []

      for (const { wpId, title } of wordpressIds) {
        const res = await fetch(`/api/wordpress/debug-property?id=${wpId}`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error al consultar WP ID ${wpId}`)
        }
        const data = await res.json()
        debugResults.push({ ...data, propertyId: wpId, title })
      }

      setResults(debugResults)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const statusIcon = (exists: boolean, hasValue: boolean) => {
    if (exists && hasValue) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (exists && !hasValue) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <XCircle className="h-4 w-4 text-destructive" />
  }

  const statusBadge = (exists: boolean, hasValue: boolean) => {
    if (exists && hasValue) return <Badge variant="default" className="bg-green-500 text-white">OK</Badge>
    if (exists && !hasValue) return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Existe pero vacío</Badge>
    return <Badge variant="destructive">No existe</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug de Dirección en WordPress
        </CardTitle>
        <CardDescription>
          Inspecciona los meta keys reales de las propiedades en WordPress para identificar
          qué campos de dirección llegan correctamente y cuáles no.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="flex items-center gap-3">
          <Button onClick={runDebug} disabled={loading} className="gap-2">
            {loading
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analizando...</>
              : <><Bug className="h-4 w-4" /> Ejecutar debug ({wordpressIds.length} propiedades)</>
            }
          </Button>
          <p className="text-sm text-muted-foreground">
            Analiza las últimas {wordpressIds.length} propiedades sincronizadas con WordPress
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.propertyId} className="border-muted">
                <CardHeader
                  className="cursor-pointer py-3"
                  onClick={() => setExpanded(expanded === result.propertyId ? null : result.propertyId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{result.title}</span>
                      <Badge variant="outline" className="text-xs">WP #{result.propertyId}</Badge>
                      {result.issues.length > 0
                        ? <Badge variant="destructive" className="text-xs">{result.issues.length} problema{result.issues.length > 1 ? "s" : ""}</Badge>
                        : <Badge className="bg-green-500 text-white text-xs">Sin problemas</Badge>
                      }
                    </div>
                    {expanded === result.propertyId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {expanded === result.propertyId && (
                  <CardContent className="pt-0 space-y-4">

                    {/* Issues */}
                    <Alert variant={result.issues.some(i => i.startsWith("OK")) ? "default" : "destructive"}>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {result.issues.map((issue, i) => (
                            <li key={i} className="text-sm">{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Nota sobre taxonomías */}
                    {result.recommendations?.nota && (
                      <Alert>
                        <AlertDescription className="text-sm text-muted-foreground">
                          {result.recommendations.nota}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Estado de las TAXONOMÍAS (lo que realmente usa WP) */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Taxonomías de ubicación (método principal):</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(result.taxonomyStatus).map(([key, status]) => (
                          <div key={key} className="flex items-center gap-2 text-sm py-1 border-b border-muted last:border-0">
                            {statusIcon(status.exists, status.hasValue)}
                            <code className="font-mono text-xs w-48 shrink-0">{key}</code>
                            {statusBadge(status.exists, status.hasValue)}
                            <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                              {status.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Estado de meta keys (fallback secundario) */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Meta keys enviados como fallback:</p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(result.ourKeysStatus).map(([key, status]) => (
                          <div key={key} className="flex items-center gap-2 text-sm py-1 border-b border-muted last:border-0">
                            {statusIcon(status.exists, status.hasValue)}
                            <code className="font-mono text-xs w-48 shrink-0">{key}</code>
                            {statusBadge(status.exists, status.hasValue)}
                            {status.hasValue && (
                              <span className="text-muted-foreground text-xs truncate max-w-[200px]">
                                = &quot;{status.value}&quot;
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Endpoint usado */}
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Endpoint usado:</span>{" "}
                      <code className="font-mono">{result.usedEndpoint}</code>
                    </div>

                    {/* Top-level keys del JSON crudo */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Top-level keys del JSON de WordPress ({result.rawTopLevelKeys.length}):</p>
                      <div className="bg-muted rounded-md p-3 font-mono text-xs flex flex-wrap gap-2">
                        {result.rawTopLevelKeys.map((k) => (
                          <code key={k} className="bg-background px-1 py-0.5 rounded border text-xs">{k}</code>
                        ))}
                      </div>
                    </div>

                    {/* Todos los meta keys (expandible) */}
                    <div>
                      <button
                        className="text-xs text-muted-foreground underline"
                        onClick={() => setShowAllKeys(!showAllKeys)}
                      >
                        {showAllKeys ? "Ocultar" : "Ver"} JSON crudo completo
                      </button>
                      {showAllKeys && (
                        <pre className="mt-2 bg-muted rounded-md p-3 font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap break-all">
                          {JSON.stringify(result.rawData, null, 2)}
                        </pre>
                      )}
                    </div>

                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
