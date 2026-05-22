'use client'

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DataPoint {
  date: string
  [key: string]: number | string
}

interface LineConfig {
  key: string
  label: string
  color: string
  yAxisId: 'left' | 'right'
  formatter: (v: number) => string
}

interface Props {
  title: string
  data: DataPoint[]
  lines: LineConfig[]
  isLoading: boolean
}

export function DualLineChart({ title, data, lines, isLoading }: Props) {
  const leftLine = lines.find((l) => l.yAxisId === 'left')
  const rightLine = lines.find((l) => l.yAxisId === 'right')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-52 w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
            Ingen data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#888' }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: leftLine?.color ?? '#888' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => leftLine?.formatter(v) ?? String(v)}
                width={55}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: rightLine?.color ?? '#888' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => rightLine?.formatter(v) ?? String(v)}
                width={55}
              />
              <Tooltip
                formatter={(value, name) => {
                  const line = lines.find((l) => l.key === name)
                  return [line ? line.formatter(Number(value)) : value, line?.label ?? name]
                }}
                labelFormatter={(label) => `Dato: ${String(label)}`}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => lines.find((l) => l.key === value)?.label ?? value}
              />
              {lines.map((l) => (
                <Line
                  key={l.key}
                  yAxisId={l.yAxisId}
                  type="monotone"
                  dataKey={l.key}
                  name={l.key}
                  stroke={l.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
