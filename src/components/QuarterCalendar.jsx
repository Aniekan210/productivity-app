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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function QuarterCalendar({
  selected,
  onSelect,
  quarterStart,
  quarterEnd,
}) {
  const [viewMonth, setViewMonth] = useState(selected || new Date());
  const start = parseISO(quarterStart);
  const end = parseISO(quarterEnd);
  const today = new Date();

  const days = useMemo(() => {
    const mStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const mEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: mStart, end: mEnd });
  }, [viewMonth]);

  const canPrev = isAfter(startOfMonth(viewMonth), startOfMonth(start));
  const canNext = isBefore(endOfMonth(viewMonth), endOfMonth(end));

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {format(viewMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={!canPrev}
            onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!canNext}
            onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
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
          return (
            <button
              key={d.toISOString()}
              disabled={disabled}
              onClick={() => !disabled && onSelect(d)}
              className={cn(
                "h-11 rounded-lg text-sm font-medium transition-colors",
                disabled ? "opacity-25 cursor-not-allowed" : "hover:bg-accent",
                isSel &&
                  !disabled &&
                  "bg-primary text-primary-foreground hover:bg-primary",
                isToday && !isSel && !disabled && "ring-1 ring-primary",
              )}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
