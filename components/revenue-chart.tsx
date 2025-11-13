"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"

export function RevenueChart() {
  const [data, setData] = useState<Array<{ month: string; revenue: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    fetch("/api/stats/revenue", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => {
        setData(data)
        setError(false)
      })
      .catch((err) => {
        console.error("[v0] RevenueChart fetch error:", err)
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
        <CardTitle>Ingresos Mensuales</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
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
            <BarChart data={data}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
