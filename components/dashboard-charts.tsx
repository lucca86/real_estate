"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell } from "recharts"

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // purple-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
]

const TRANSACTION_COLORS = {
  Venta: "#3b82f6", // blue-500
  Alquiler: "#10b981", // green-500
  "Venta/Alquiler": "#f59e0b", // amber-500
  "Alquiler con Opción a Compra": "#8b5cf6", // purple-500
}

interface DashboardChartsProps {
  propertyTypes: { name: string; count: number }[]
  transactionTypes: { name: string; count: number }[]
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null // Don't show label if slice is too small

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="font-semibold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value} {payload[0].value === 1 ? "propiedad" : "propiedades"}
        </p>
      </div>
    )
  }
  return null
}

export function DashboardCharts({ propertyTypes = [], transactionTypes = [] }: DashboardChartsProps) {
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
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={propertyTypes}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {propertyTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => `${value} (${entry.payload.count})`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Types Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Propiedades por Tipo de Transacción</CardTitle>
          <CardDescription>Distribución de transacciones inmobiliarias</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionTypes}>
                <XAxis
                  dataKey="name"
                  angle={-20}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(var(--foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  payload={transactionTypes.map((item) => ({
                    value: `${item.name} (${item.count})`,
                    type: "rect",
                    color:
                      TRANSACTION_COLORS[item.name as keyof typeof TRANSACTION_COLORS] ||
                      COLORS[transactionTypes.indexOf(item) % COLORS.length],
                  }))}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {transactionTypes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        TRANSACTION_COLORS[entry.name as keyof typeof TRANSACTION_COLORS] ||
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Bar>
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
