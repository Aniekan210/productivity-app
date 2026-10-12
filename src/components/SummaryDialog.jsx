import React, { useMemo } from "react";
import { parseISO } from "date-fns";
import { Check } from "lucide-react";
import {
  buildDayMap,
  quarterProgress,
  activityCompletion,
  dayClassifications,
  todayKey,
  fmtDate,
  quarterDayCount,
  pct,
} from "@/lib/quarterUtils";
import QuarterGrid from "@/components/QuarterGrid";
import StatStrip from "@/components/StatStrip";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SummaryDialog({
  open,
  onOpenChange,
  quarter,
  goals = [],
  activities = [],
  accent = "violet",
}) {
  const tz = undefined;
  const dayMap = useMemo(() => buildDayMap(activities), [activities]);

  if (!quarter) return null;

  const inProgress = quarter.status === "active";
  const today = todayKey(tz);
  const upTo = inProgress ? today : quarter.end_date;
  const progress = quarterProgress(quarter.start_date, quarter.end_date, today);
  const actComp = activityCompletion(dayMap, upTo);
  const classes = dayClassifications(dayMap, upTo);
  const goalsCompleted = goals.filter((g) => g.status === "completed").length;
  const goalsTotal = goals.length;
  const totalDays = quarterDayCount(quarter.start_date, quarter.end_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <p className="text-sm text-muted-foreground">
            {inProgress
              ? `Day ${progress.dayNumber} of ${totalDays}`
              : "Completed"}
          </p>
          <DialogTitle className="text-[1.75rem]">{quarter.name}</DialogTitle>
          <DialogDescription className="tabular-nums">
            {fmtDate(parseISO(quarter.start_date))} –{" "}
            {fmtDate(parseISO(quarter.end_date))} · {totalDays} days
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <QuarterGrid
            quarter={quarter}
            dayMap={dayMap}
            accent={accent}
            todayKeyStr={today}
          />

          <StatStrip
            items={[
              {
                label: "Goals",
                value: goalsTotal ? `${goalsCompleted}/${goalsTotal}` : "—",
                sub: goalsTotal
                  ? `${pct(goalsCompleted / goalsTotal)}%`
                  : "none set",
                accent: true,
              },
              {
                label: "Activities",
                value: actComp.planned ? `${pct(actComp.rate)}%` : "—",
                sub: `${actComp.completed} of ${actComp.planned}`,
                accent: true,
              },
              {
                label: "Perfect days",
                value: classes.perfect,
                sub: "everything done",
              },
            ]}
          />

          <section>
            <h3 className="section-title">Goals</h3>
            <ol className="mt-2 divide-y divide-border">
              {goalsTotal === 0 && (
                <li className="py-4 text-sm text-muted-foreground">
                  No goals set for this quarter.
                </li>
              )}
              {goals.map((g) => (
                <li key={g.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-sm border-[1.5px]",
                      g.status === "completed"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/60",
                    )}
                  >
                    {g.status === "completed" && (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    )}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 break-words text-sm",
                      g.status !== "active" &&
                        "text-muted-foreground line-through decoration-muted-foreground/50",
                    )}
                  >
                    {g.title}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
