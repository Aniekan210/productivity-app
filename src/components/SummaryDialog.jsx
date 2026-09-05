import React, { useMemo } from "react";
import { parseISO } from "date-fns";
import { Check, Target } from "lucide-react";
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
import { getAccent } from "@/lib/theme";
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

  const a = getAccent(accent);
  const brand = `hsl(${a.channels})`;
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
          <DialogTitle className="font-display text-xl font-semibold tracking-tight">
            {quarter.name}
          </DialogTitle>
          <DialogDescription>
            {fmtDate(parseISO(quarter.start_date))} –{" "}
            {fmtDate(parseISO(quarter.end_date))} · {totalDays} days
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: `hsl(${a.channels} / 0.14)`, color: brand }}
            >
              {inProgress
                ? `Day ${progress.dayNumber} / ${totalDays}`
                : `${totalDays} / ${totalDays} days`}
            </span>
            <span className="text-xs text-muted-foreground">
              {inProgress ? "In progress" : "Completed"}
            </span>
          </div>

          <section>
            <h3 className="mb-3 text-sm font-semibold">90-Day Timeline</h3>
            <QuarterGrid
              quarter={quarter}
              dayMap={dayMap}
              accent={accent}
              todayKeyStr={today}
              selectedKey={today}
              onSelect={() => {}}
            />
          </section>

          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Goals"
              value={goalsTotal ? `${goalsCompleted}/${goalsTotal}` : "—"}
              sub={goalsTotal ? `${pct(goalsCompleted / goalsTotal)}%` : "none"}
              brand={brand}
            />
            <Stat
              label="Activity"
              value={actComp.planned ? `${pct(actComp.rate)}%` : "—"}
              sub={`${actComp.completed}/${actComp.planned} done`}
              brand={brand}
            />
            <Stat
              label="Perfect days"
              value={classes.perfect}
              sub="all done"
              brand={brand}
            />
          </div>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" style={{ color: brand }} />
              <h3 className="text-sm font-semibold">Goals</h3>
            </div>
            <div className="space-y-1.5">
              {goalsTotal === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No goals set for this quarter.
                </p>
              )}
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full border text-xs"
                    style={
                      g.status === "completed"
                        ? {
                            background: brand,
                            color: "#fff",
                            borderColor: "transparent",
                          }
                        : {}
                    }
                  >
                    {g.status === "completed" && <Check className="h-3 w-3" />}
                  </span>
                  <span
                    className={`flex-1 text-sm ${g.status !== "active" ? "text-muted-foreground line-through" : ""}`}
                  >
                    {g.title}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, sub, brand }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: brand }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
