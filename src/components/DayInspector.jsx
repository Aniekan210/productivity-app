import React from "react";
import { parseISO, format } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Read-only look at one day of the timeline.
export default function DayInspector({ dateKey, dayData, todayKeyStr, className }) {
  const date = parseISO(dateKey);
  const isToday = dateKey === todayKeyStr;
  const isFuture = dateKey > todayKeyStr;
  const planned = dayData?.planned || 0;
  const completed = dayData?.completed || 0;

  return (
    <div className={cn("rounded-lg bg-muted/60 p-4", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">
          {isToday ? "Today" : format(date, "EEEE")}
          <span className="font-normal text-muted-foreground">
            {" "}
            · {format(date, "MMM d")}
          </span>
        </p>
        {planned > 0 && (
          <p className="text-sm tabular-nums text-muted-foreground">
            <span className="font-medium text-foreground">{completed}</span>/
            {planned}
          </p>
        )}
      </div>

      {planned === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {isFuture ? "Nothing planned yet." : "Nothing was planned."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {dayData.activities.map((a) => (
            <li key={a.id} className="flex items-start gap-2.5 text-sm">
              <span
                className={cn(
                  "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-[1.5px]",
                  a.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/40",
                )}
              >
                {a.completed && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
              </span>
              <span
                className={cn(
                  "min-w-0 break-words",
                  a.completed && "text-muted-foreground line-through decoration-muted-foreground/50",
                )}
              >
                {a.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
