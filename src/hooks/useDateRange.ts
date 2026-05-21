'use client'

import { useState } from 'react'
import type { DateRange } from '@/types'

function defaultRange(): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  return { from, to }
}

export function useDateRange() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)
  return { dateRange, setDateRange }
}
