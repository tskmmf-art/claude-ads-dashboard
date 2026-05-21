'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import type { DateRange } from '@/types'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  dateRange: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ dateRange, onChange }: Props) {
  const [open, setOpen] = React.useState(false)
  const [selection, setSelection] = React.useState<{ from?: Date; to?: Date }>({
    from: dateRange.from,
    to: dateRange.to,
  })

  function handleSelect(range: { from?: Date; to?: Date } | undefined) {
    if (!range) return
    setSelection(range)
    if (range.from && range.to) {
      onChange({ from: range.from, to: range.to })
      setOpen(false)
    }
  }

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-60 justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.from && dateRange.to
            ? `${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`
            : 'Pick a date range'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="range"
          selected={selection as { from: Date; to: Date }}
          onSelect={handleSelect}
          disabled={{ after: new Date(), before: twelveMonthsAgo }}
          numberOfMonths={2}
          defaultMonth={dateRange.from}
        />
      </PopoverContent>
    </Popover>
  )
}
