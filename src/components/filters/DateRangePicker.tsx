"use client";

import { format, subMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import type { DateRange } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

interface Props {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onChange }: Props) {
  const today = new Date();
  const minDate = subMonths(today, 36);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-72 justify-start text-left font-normal",
            !dateRange.from && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />

          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "MMM d, yyyy")} –{" "}
                {format(dateRange.to, "MMM d, yyyy")}
              </>
            ) : (
              format(dateRange.from, "MMM d, yyyy")
            )
          ) : (
            "Pick a date range"
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="range"
          selected={dateRange}
          onSelect={(range) => {
            if (!range?.from) return;

            onChange({
              from: range.from,
              to: range.to ?? range.from,
            });
          }}
          defaultMonth={dateRange.from}
          disabled={{
            before: minDate,
            after: today,
          }}
          excludeDisabled
        />
      </PopoverContent>
    </Popover>
  );
}
