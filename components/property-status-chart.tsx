"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"

export function PropertyStatusChart() {
  const [data, setData] = useState<Array<{ name: string; value: number; color: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    fetch("/api/stats/property-status", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => {
        setData(data)
        setError(false)
      })
      .catch((err) => {
        console.error("[v0] PropertyStatusChart fetch error:", err)
        setError(true)
        setData([])
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setLoading(false)
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Propiedades</CardTitle>
        <CardDescription>Distribución por estado actual</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Error al cargar datos
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No hay datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
