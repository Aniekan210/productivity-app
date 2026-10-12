import React from "react";
import {
  buildDayMap,
  activityCompletion,
  todayKey,
  pct,
} from "@/lib/quarterUtils";
import { cn } from "@/lib/utils";

function metrics(quarter, goals, activities) {
  const dayMap = buildDayMap(activities);
  const upTo = quarter.status === "active" ? todayKey() : quarter.end_date;
  const act = activityCompletion(dayMap, upTo);
  const goalsCompleted = (goals || []).filter(
    (g) => g.status === "completed",
  ).length;
  const goalsTotal = (goals || []).length;
  return {
    goalsCompleted,
    goalsTotal,
    goalRate: goalsTotal ? goalsCompleted / goalsTotal : 0,
    actCompleted: act.completed,
    actPlanned: act.planned,
    actRate: act.planned ? act.rate : 0,
  };
}

function Bar({ value, strong }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={strong ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-muted-foreground/40"}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export default function QuarterComparison({
  prev,
  prevGoals,
  prevActs,
  cur,
  curGoals,
  curActs,
}) {
  if (!prev) return null;
  const p = metrics(prev, prevGoals, prevActs);
  const c = metrics(cur, curGoals, curActs);
  const delta = (a, b) => Math.round((b - a) * 100);

  const rows = [
    {
      label: "Goals completed",
      a: `${p.goalsCompleted}/${p.goalsTotal}`,
      b: `${c.goalsCompleted}/${c.goalsTotal}`,
      barA: p.goalRate,
      barB: c.goalRate,
      pctA: pct(p.goalRate),
      pctB: pct(c.goalRate),
    },
    {
      label: "Activity completion",
      a: `${pct(p.actRate)}%`,
      b: `${pct(c.actRate)}%`,
      barA: p.actRate,
      barB: c.actRate,
      pctA: pct(p.actRate),
      pctB: pct(c.actRate),
    },
  ];

  return (
    <section className="surface-card p-5 sm:p-6">
      <h2 className="section-title">
        Compared with {prev.name}
      </h2>
      <p className="text-sm text-muted-foreground">
        Your actual numbers, quarter on quarter.
      </p>
      <div className="mt-5 space-y-6">
        {rows.map((r) => {
          const d = delta(r.barA, r.barB);
          return (
            <div key={r.label}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">{r.label}</span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    d > 0 && "text-emerald-600 dark:text-emerald-400",
                    d < 0 && "text-rose-600 dark:text-rose-400",
                    d === 0 && "text-muted-foreground",
                  )}
                >
                  {d > 0 ? `+${d}` : d === 0 ? "±0" : d} pts
                </span>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-xs text-muted-foreground tabular-nums">
                  <span className="truncate">{prev.name}</span>
                  <Bar value={r.barA} />
                  <span className="text-right">{r.a}</span>
                </div>
                <div className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3 text-xs tabular-nums">
                  <span className="truncate font-medium">{cur.name}</span>
                  <Bar value={r.barB} strong />
                  <span className="text-right font-medium">{r.b}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
