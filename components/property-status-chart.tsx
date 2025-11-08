"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { useEffect, useState } from "react"

export function PropertyStatusChart() {
  const [data, setData] = useState<Array<{ name: string; value: number; color: string }>>([])

  useEffect(() => {
    fetch("/api/stats/property-status")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(() => {})
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Propiedades</CardTitle>
        <CardDescription>Distribución por estado actual</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
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
