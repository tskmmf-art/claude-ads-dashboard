'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DailySpend } from '@/lib/utils/aggregators'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/formatters'

const LINES = [
  { key: 'meta', color: '#1877F2', label: 'Meta' },
  { key: 'google', color: '#34A853', label: 'Google' },
  { key: 'linkedin', color: '#0A66C2', label: 'LinkedIn' },
]

interface Props {
  data: DailySpend[]
  isLoading: boolean
  activePlatforms: string[]
}

export function SpendChart({ data, isLoading, activePlatforms }: Props) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Spend Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              {LINES.filter((l) => activePlatforms.includes(l.key)).map((l) => (
                <Line
                  key={l.key}
                  type="monotone"
                  dataKey={l.key}
                  name={l.label}
                  stroke={l.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
