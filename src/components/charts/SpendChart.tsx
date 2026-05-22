'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailySpend } from '@/lib/utils/aggregators'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/formatters'

const PLATFORM_COLORS: Record<string, string> = {
  meta: '#1877F2',
  google: '#34A853',
  linkedin: '#0A66C2',
}

interface Props {
  data: DailySpend[]
  isLoading: boolean
  activePlatforms: string[]
}

export function SpendChart({ data, isLoading, activePlatforms }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">Spend dynamics</CardTitle>
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
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {activePlatforms.map((p) => (
                  <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PLATFORM_COLORS[p] ?? '#888'} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={PLATFORM_COLORS[p] ?? '#888'} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#888' }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888' }}
                tickFormatter={(v: number) => formatCurrency(v)}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                labelFormatter={(label) => `Dato: ${String(label)}`}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              {activePlatforms.map((p) => (
                <Area
                  key={p}
                  type="monotone"
                  dataKey={p}
                  name={p.charAt(0).toUpperCase() + p.slice(1)}
                  stroke={PLATFORM_COLORS[p] ?? '#888'}
                  strokeWidth={2}
                  fill={`url(#grad-${p})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
