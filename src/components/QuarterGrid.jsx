import React, { useMemo } from "react";
import { format } from "date-fns";
import { buildTimelineGrid, dayIntensity, dayKey } from "@/lib/quarterUtils";
import { intensityColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

const ROW_LABELS = ["M", "", "W", "", "F", "", ""];
const LEGEND_LEVELS = [0, 1, 2, 3, 4];

// The 90-day heatmap: weeks as columns, Mon–Sun as rows. Columns are fluid,
// so the grid always fits its container (no sideways scroll on phones) and
// cells stay square. Cell rounding follows the user's corner style.
export default function QuarterGrid({
  quarter,
  dayMap,
  accent,
  todayKeyStr,
  selectedKey,
  onSelect,
  showLegend = true,
  className,
}) {
  const grid = useMemo(
    () => buildTimelineGrid(quarter.start_date, quarter.end_date),
    [quarter.start_date, quarter.end_date],
  );
  const cols = grid.weeks.length;

  // Month label above the first week that contains that month's 1st day in
  // the quarter (or the quarter's first week).
  const monthLabels = grid.weeks.map((week, wi) => {
    const first = week.find((d) => grid.inQuarter.has(dayKey(d)));
    if (!first) return "";
    if (wi === 0) return format(first, "MMM");
    const startsMonth = week.some(
      (d) => d.getDate() === 1 && grid.inQuarter.has(dayKey(d)),
    );
    return startsMonth
      ? format(
          week.find((d) => d.getDate() === 1),
          "MMM",
        )
      : "";
  });

  const template = { gridTemplateColumns: `1rem repeat(${cols}, minmax(0, 1fr))` };
  const interactive = typeof onSelect === "function";

  return (
    <div className={cn("w-full", className)}>
      <div
        className="grid gap-x-[clamp(2px,0.8vw,5px)]"
        style={template}
        aria-hidden="true"
      >
        <span />
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="h-5 overflow-visible whitespace-nowrap text-[11px] text-muted-foreground"
          >
            {m}
          </span>
        ))}
      </div>

      <div
        role="grid"
        aria-label={`${quarter.name} timeline`}
        className="grid grid-flow-col gap-[clamp(2px,0.8vw,5px)]"
        style={{ ...template, gridTemplateRows: "repeat(7, auto)" }}
      >
        {ROW_LABELS.map((l, i) => (
          <span
            key={`l${i}`}
            aria-hidden="true"
            className="flex items-center text-[10px] leading-none text-muted-foreground"
          >
            {l}
          </span>
        ))}
        {grid.weeks.flatMap((week) =>
          week.map((d) => {
            const k = dayKey(d);
            if (!grid.inQuarter.has(k)) return <span key={k} />;
            const data = dayMap[k] || { planned: 0, completed: 0 };
            const level = dayIntensity(data.planned, data.completed);
            const isToday = k === todayKeyStr;
            const isSelected = k === selectedKey;
            const isFuture = k > todayKeyStr;
            const label = `${format(d, "EEEE, MMMM d")}: ${
              data.planned
                ? `${data.completed} of ${data.planned} done`
                : "nothing planned"
            }`;
            const Cell = interactive ? "button" : "span";
            return (
              <Cell
                key={k}
                {...(interactive && {
                  type: "button",
                  onClick: () => onSelect(k),
                  "aria-pressed": isSelected,
                })}
                title={label}
                aria-label={label}
                className={cn(
                  "relative aspect-square w-full rounded-[calc(var(--radius)*0.4)] transition-[transform,opacity]",
                  interactive &&
                    "cursor-pointer hover:z-10 hover:scale-[1.15] focus-visible:z-10 focus-visible:outline-none",
                  isFuture && level === -1 && "opacity-60",
                  isSelected &&
                    "z-[1] outline outline-2 outline-offset-[1.5px] outline-primary",
                  isToday &&
                    !isSelected &&
                    "outline outline-[1.5px] outline-offset-[1.5px] outline-foreground/70",
                )}
                style={{ backgroundColor: intensityColor(accent, level) }}
              />
            );
          }),
        )}
      </div>

      {showLegend && (
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
          <span className="mr-0.5">Less</span>
          {LEGEND_LEVELS.map((lvl) => (
            <span
              key={lvl}
              className="h-2.5 w-2.5 rounded-[calc(var(--radius)*0.2)]"
              style={{ backgroundColor: intensityColor(accent, lvl) }}
            />
          ))}
          <span className="ml-0.5">More</span>
        </div>
      )}
    </div>
  );
}
