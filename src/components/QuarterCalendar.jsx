import React, { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  addMonths,
  format,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dayIntensity, dayKey } from "@/lib/quarterUtils";

// Weeks start on Monday, matching the 90-day timeline.
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MARK_OPACITY = { 0: 0.18, 1: 0.4, 2: 0.6, 3: 0.8, 4: 1 };

export default function QuarterCalendar({
  selected,
  onSelect,
  quarterStart,
  quarterEnd,
  dayMap = {},
}) {
  const [viewMonth, setViewMonth] = useState(selected || new Date());
  const start = parseISO(quarterStart);
  const end = parseISO(quarterEnd);
  const today = new Date();

  const days = useMemo(() => {
    const mStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const mEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: mStart, end: mEnd });
  }, [viewMonth]);

  const canPrev = isAfter(startOfMonth(viewMonth), startOfMonth(start));
  const canNext = isBefore(endOfMonth(viewMonth), endOfMonth(end));

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-xl font-medium tracking-tight">
          {format(viewMonth, "MMMM")}{" "}
          <span className="text-muted-foreground">
            {format(viewMonth, "yyyy")}
          </span>
        </h3>
        <div className="flex gap-1">
          <button
            className="icon-btn disabled:pointer-events-none disabled:opacity-30"
            disabled={!canPrev}
            onClick={() => setViewMonth(addMonths(viewMonth, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="icon-btn disabled:pointer-events-none disabled:opacity-30"
            disabled={!canNext}
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="pb-1 text-center text-[11px] text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((d) => {
          const inMonth = isSameMonth(d, viewMonth);
          const inQuarter = !isBefore(d, start) && !isAfter(d, end);
          const isSel = selected && isSameDay(d, selected);
          const isToday = isSameDay(d, today);
          const disabled = !inMonth || !inQuarter;
          const data = dayMap[dayKey(d)];
          const level = data ? dayIntensity(data.planned, data.completed) : -1;
          if (!inMonth) return <span key={d.toISOString()} />;
          return (
            <button
              key={d.toISOString()}
              disabled={disabled}
              onClick={() => !disabled && onSelect(d)}
              aria-pressed={!!isSel}
              aria-label={`${format(d, "EEEE, MMMM d")}${
                data ? `, ${data.completed} of ${data.planned} done` : ""
              }`}
              className={cn(
                "relative flex aspect-square max-h-14 w-full flex-col items-center justify-center rounded-md text-sm tabular-nums transition-colors",
                disabled
                  ? "cursor-default text-muted-foreground/40"
                  : "hover:bg-muted",
                isToday && !isSel && "font-semibold text-primary ring-1 ring-inset ring-primary",
                isSel &&
                  "bg-primary font-medium text-primary-foreground hover:bg-primary",
              )}
            >
              {format(d, "d")}
              <span
                aria-hidden="true"
                className="absolute bottom-[18%] h-1 w-1 rounded-full"
                style={{
                  backgroundColor:
                    level >= 0
                      ? isSel
                        ? "hsl(var(--primary-foreground))"
                        : `hsl(var(--brand) / ${MARK_OPACITY[level]})`
                      : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
