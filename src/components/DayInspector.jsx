// @ts-ignore
import React from "react";
import { parseISO, format } from "date-fns";
// @ts-ignore
import { Check, Circle, Minus } from "lucide-react";
import { dayIntensity } from "@/lib/quarterUtils";
import { cn } from "@/lib/utils";

// @ts-ignore
export default function DayInspector({ dateKey, dayData, todayKeyStr }) {
  const date = parseISO(dateKey);
  const isToday = dateKey === todayKeyStr;
  const planned = dayData?.planned || 0;
  const completed = dayData?.completed || 0;
  // @ts-ignore
  const level = dayIntensity(planned, completed);

  const legend = ["-1", "0", "1", "2", "3", "4"];
  const labels = {
    "-1": "No activities",
    0: "0%",
    1: "Low",
    2: "Medium",
    3: "High",
    4: "100%",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">
            {isToday ? "Today · " : ""}
            {format(date, "EEEE, MMM d")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {planned === 0
              ? "Nothing planned"
              : `${completed} / ${planned} completed`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {legend.map((l) => (
            <span
              key={l}
              className={cn(
                "h-3 w-3 rounded-[3px]",
                l === "-1" && "border border-border",
              )}
              style={{
                backgroundColor:
                  l === "-1"
                    ? "transparent"
                    : `hsl(var(--brand) / ${l === "0" ? 0.08 : l === "1" ? 0.28 : l === "2" ? 0.5 : l === "3" ? 0.72 : 1})`,
              }}
              // @ts-ignore
              title={labels[l]}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {planned === 0 && (
          <p className="py-2 text-sm text-muted-foreground">
            No activities planned for this day.
          </p>
        )}
        {(dayData?.activities || []).map((
// @ts-ignore
        a) => (
          <div key={a.id} className="flex items-center gap-2 text-sm">
            {a.completed ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                a.completed && "text-muted-foreground line-through",
              )}
            >
              {a.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
