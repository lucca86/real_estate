"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getAgentRanking } from "@/lib/actions/dashboard"

type Period = "week" | "month" | "year" | "all"

const PERIOD_LABELS: Record<Period, string> = {
  week: "Semana",
  month: "Mes",
  year: "Año",
  all: "Todo",
}

const PERIOD_DESCRIPTIONS: Record<Period, string> = {
  week: "Última semana",
  month: "Último mes",
  year: "Último año",
  all: "Historial completo",
}

const BAR_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#ef4444", // red
]

interface AgentData {
  name: string
  count: number
}

interface AgentRankingChartProps {
  initialData: AgentData[]
}

export function AgentRankingChart({ initialData }: AgentRankingChartProps) {
  const [period, setPeriod] = useState<Period>("week")
  const [data, setData] = useState<AgentData[]>(initialData)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod)
    startTransition(async () => {
      const result = await getAgentRanking(newPeriod)
      setData(result)
    })
  }

  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Ranking de Agentes por Propiedades Creadas</CardTitle>
          <CardDescription>{PERIOD_DESCRIPTIONS[period]}</CardDescription>
        </div>
        <div className="flex gap-1 shrink-0">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "ghost"}
              onClick={() => handlePeriodChange(p)}
              disabled={isPending}
              className="text-xs px-3"
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay datos para el período seleccionado
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((agent, index) => {
              const widthPct = Math.max((agent.count / maxCount) * 100, 4)
              const color = BAR_COLORS[index % BAR_COLORS.length]
              return (
                <div key={agent.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div
                      className="flex items-center rounded px-3 py-1.5 text-sm font-medium text-white transition-all duration-500"
                      style={{ width: `${widthPct}%`, backgroundColor: color, minWidth: "fit-content" }}
                    >
                      {agent.name}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap w-16 text-right">
                    {agent.count} prop.
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
