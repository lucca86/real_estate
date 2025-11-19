"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell } from "recharts"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

interface DashboardChartsProps {
  propertyTypes: { name: string; count: number }[]
  cities: { name: string; count: number }[]
}

export function DashboardCharts({ propertyTypes, cities }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Property Types Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Propiedades por Tipo</CardTitle>
          <CardDescription>Distribución de tipos de propiedad</CardDescription>
        </CardHeader>
        <CardContent>
          {propertyTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={propertyTypes}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.count}`}
                >
                  {propertyTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cities Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Propiedades por Ciudad</CardTitle>
          <CardDescription>Top 5 ciudades con más propiedades</CardDescription>
        </CardHeader>
        <CardContent>
          {cities.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cities}>
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Propiedades" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
