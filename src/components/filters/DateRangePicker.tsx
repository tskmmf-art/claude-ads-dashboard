"use client";

import * as React from "react";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import { da } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import type { DateRange } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ─── Presets ────────────────────────────────────────────────────────────────

interface Preset {
  key: string;
  label: string;
}

const PRESETS: Preset[] = [
  { key: "today", label: "I dag" },
  { key: "yesterday", label: "I går" },
  { key: "today_yesterday", label: "I dag og i går" },
  { key: "last7", label: "Seneste 7 dage" },
  { key: "last14", label: "Seneste 14 dage" },
  { key: "last28", label: "Seneste 28 dage" },
  { key: "last30", label: "Seneste 30 dage" },
  { key: "this_week", label: "Denne uge" },
  { key: "last_week", label: "Seneste uge" },
  { key: "this_month", label: "Denne måned" },
  { key: "last_month", label: "Seneste måned" },
  { key: "max", label: "Maksimum" },
];

function getPresetRange(key: string): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (key) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const d = subDays(today, 1);
      return { from: d, to: d };
    }
    case "today_yesterday":
      return { from: subDays(today, 1), to: today };
    case "last7":
      return { from: subDays(today, 6), to: today };
    case "last14":
      return { from: subDays(today, 13), to: today };
    case "last28":
      return { from: subDays(today, 27), to: today };
    case "last30":
      return { from: subDays(today, 29), to: today };
    case "this_week":
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
    case "last_week": {
      const s = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      return { from: s, to: endOfWeek(s, { weekStartsOn: 1 }) };
    }
    case "this_month":
      return { from: startOfMonth(today), to: today };
    case "last_month": {
      const lm = subMonths(today, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case "max":
      return { from: subMonths(today, 36), to: today };
    default:
      return { from: today, to: today };
  }
}

function detectPreset(range: DateRange): string | null {
  for (const p of PRESETS) {
    const pr = getPresetRange(p.key);
    if (isSameDay(pr.from, range.from) && isSameDay(pr.to, range.to)) {
      return p.key;
    }
  }
  return null;
}

function formatLabel(range: DateRange): string {
  return `${format(range.from, "d. MMM yyyy", { locale: da })} – ${format(range.to, "d. MMM yyyy", { locale: da })}`;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<DateRange>(dateRange);
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(dateRange.from);

  const activePreset = detectPreset(pending);
  const triggerPreset = detectPreset(dateRange);
  const triggerLabel = triggerPreset
    ? `${PRESETS.find((p) => p.key === triggerPreset)?.label}: ${formatLabel(dateRange)}`
    : formatLabel(dateRange);

  function handleOpen(v: boolean) {
    if (v) setPending(dateRange); // reset to committed on open
    setOpen(v);
  }

  function handlePreset(key: string) {
    const range = getPresetRange(key);
    setPending(range);
    setCalendarMonth(range.from);
  }

  function handleCalendar(range: { from?: Date; to?: Date } | undefined) {
    if (!range?.from) return;
    setPending({ from: range.from, to: range.to ?? range.from });
  }

  function handleApply() {
    onChange(pending);
    setOpen(false);
  }

  function handleCancel() {
    setPending(dateRange);
    setOpen(false);
  }

  const today = new Date();
  const minDate = subMonths(today, 36);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>{triggerLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-auto p-0 shadow-xl"
        style={{ minWidth: 620 }}
      >
        <div className="flex">
          {/* ── Left: Preset list ── */}
          <div className="w-44 shrink-0 overflow-y-auto border-r py-3">
            <p className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Periode
            </p>
            {PRESETS.map((p) => {
              const selected = activePreset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => handlePreset(p.key)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-1.5 text-sm transition-colors hover:bg-muted/60",
                    selected ? "font-medium text-primary" : "text-foreground"
                  )}
                >
                  {/* Radio circle */}
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </span>
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* ── Right: Calendar + footer ── */}
          <div className="flex flex-col">
            <DayPicker
              mode="range"
              selected={pending}
              onSelect={handleCalendar}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              numberOfMonths={2}
              locale={da}
              disabled={{ before: minDate, after: today }}
              showOutsideDays={false}
              classNames={{
                root: "p-3",
                months: "flex gap-6",
                month_caption: "flex justify-center items-center mb-1",
                caption_label: "text-sm font-semibold",
                nav: "flex items-center",
                button_previous: "absolute left-3 top-3 p-1 rounded hover:bg-muted",
                button_next: "absolute right-3 top-3 p-1 rounded hover:bg-muted",
                month_grid: "w-full border-collapse",
                weekdays: "flex",
                weekday: "w-8 text-center text-xs font-medium text-muted-foreground py-1",
                week: "flex",
                day: "h-8 w-8 p-0 text-sm",
                day_button: cn(
                  "h-8 w-8 rounded-md text-sm transition-colors",
                  "hover:bg-primary/10 focus:outline-none"
                ),
                selected: "bg-primary text-primary-foreground rounded-md",
                range_start: "bg-primary text-primary-foreground rounded-l-md rounded-r-none",
                range_end: "bg-primary text-primary-foreground rounded-r-md rounded-l-none",
                range_middle: "bg-primary/15 rounded-none text-foreground",
                today: "font-bold",
                outside: "text-muted-foreground/40",
                disabled: "text-muted-foreground/30 cursor-not-allowed",
              }}
            />

            {/* Footer */}
            <div className="border-t px-4 py-3">
              <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded border bg-muted/40 px-2 py-0.5 font-medium text-foreground">
                  {activePreset
                    ? PRESETS.find((p) => p.key === activePreset)?.label
                    : "Brugerdefineret"}
                </span>
                <span>
                  {format(pending.from, "d. MMM yyyy", { locale: da })}
                  {" – "}
                  {format(pending.to, "d. MMM yyyy", { locale: da })}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Datoer vises i København-tid
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="rounded-md border px-4 py-1.5 text-sm font-medium hover:bg-muted"
                >
                  Annuller
                </button>
                <button
                  onClick={handleApply}
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Opdater
                </button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
