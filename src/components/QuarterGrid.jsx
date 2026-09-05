import React, { useMemo } from "react";
import { format } from "date-fns";
import {
  buildTimelineGrid,
  dayIntensity,
  dayKey,
  WEEKDAY_LABELS,
} from "@/lib/quarterUtils";
import { intensityColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function QuarterGrid({
  quarter,
  dayMap,
  accent,
  todayKeyStr,
  selectedKey,
  onSelect,
}) {
  const grid = useMemo(
    () => buildTimelineGrid(quarter.start_date, quarter.end_date),
    [quarter.start_date, quarter.end_date],
  );

  return (
    <div className="w-full">
      {/* month labels */}
      <div className="mb-2 flex gap-2">
        <div className="w-5 shrink-0" />
        <div className="flex flex-1 justify-between text-[10px] font-medium text-muted-foreground">
          {grid.weeks.map((week, wi) => {
            const first = week.find((d) => grid.inQuarter.has(dayKey(d)));
            const prev =
              wi > 0
                ? grid.weeks[wi - 1].find((d) => grid.inQuarter.has(dayKey(d)))
                : null;
            const show =
              first && (!prev || format(first, "MMM") !== format(prev, "MMM"));
            return (
              <div key={wi} className="w-[26px] text-left">
                {show ? format(first, "MMM") : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        {/* weekday labels */}
        <div className="flex w-5 shrink-0 flex-col gap-1.5 text-[10px] font-medium text-muted-foreground">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="flex h-[26px] items-center justify-end">
              {d[0]}
            </div>
          ))}
        </div>

        {/* weeks */}
        <div className="flex flex-1 justify-between">
          {grid.weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((d) => {
                const k = dayKey(d);
                if (!grid.inQuarter.has(k))
                  return <div key={k} className="h-[26px] w-[26px]" />;
                const data = dayMap[k] || {
                  planned: 0,
                  completed: 0,
                  activities: [],
                };
                const level = dayIntensity(data.planned, data.completed);
                const isToday = k === todayKeyStr;
                const isSelected = k === selectedKey;
                const isFuture = k > todayKeyStr;
                return (
                  <button
                    key={k}
                    onClick={() => onSelect(k)}
                    title={`${format(d, "MMM d")} · ${data.completed}/${data.planned}`}
                    aria-label={`${format(d, "MMMM d")}: ${data.completed} of ${data.planned} activities completed`}
                    className={cn(
                      "h-[26px] w-[26px] rounded-[5px] transition-transform hover:scale-125 hover:z-10",
                      isSelected &&
                        "ring-2 ring-ring ring-offset-1 ring-offset-background",
                      isFuture && "opacity-40",
                    )}
                    style={{
                      backgroundColor: intensityColor(accent, level),
                      boxShadow: isToday
                        ? "0 0 0 2px hsl(var(--foreground))"
                        : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
