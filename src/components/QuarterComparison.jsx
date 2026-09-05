import React from "react";
import {
  buildDayMap,
  activityCompletion,
  todayKey,
  quarterProgress,
  pct,
} from "@/lib/quarterUtils";

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

function Bar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
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
    <section className="surface-card p-5">
      <h2 className="text-base font-semibold">
        {prev.name} → {cur.name}
      </h2>
      <p className="text-xs text-muted-foreground">
        Comparing your actual numbers — no forced 3/6 framework.
      </p>
      <div className="mt-4 space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{r.label}</span>
              <span className="text-xs text-muted-foreground">
                {r.pctA}% → {r.pctB}%{" "}
                {delta(r.barA, r.barB) > 0 && (
                  <span className="text-emerald-500">
                    +{delta(r.barA, r.barB)}
                  </span>
                )}
                {delta(r.barA, r.barB) < 0 && (
                  <span className="text-rose-500">{delta(r.barA, r.barB)}</span>
                )}
                {delta(r.barA, r.barB) === 0 && (
                  <span className="text-muted-foreground">±0</span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  {prev.name} · {r.a}
                </p>
                <Bar value={r.barA} />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  {cur.name} · {r.b}
                </p>
                <Bar value={r.barB} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
