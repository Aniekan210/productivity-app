import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ScrollText } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  useQuarters,
  useQuarter,
  useGoals,
  useActivities,
} from "@/lib/useData";
import {
  buildDayMap,
  quarterProgress,
  activityCompletion,
  dayClassifications,
  todayKey,
  quarterDayCount,
  pct,
} from "@/lib/quarterUtils";
import QuarterGrid from "@/components/QuarterGrid";
import DayInspector from "@/components/DayInspector";
import QuarterComparison from "@/components/QuarterComparison";
import SummaryDialog from "@/components/SummaryDialog";
import StatStrip from "@/components/StatStrip";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function QuarterDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const tz = user?.timezone;
  const { data: quarter } = useQuarter(id);
  const goalsQ = useGoals(id);
  const actsQ = useActivities(id);
  const { data: allQuarters } = useQuarters();

  const [selectedKey, setSelectedKey] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const goals = goalsQ.data || [];
  const activities = actsQ.data || [];
  const dayMap = useMemo(() => buildDayMap(activities), [activities]);

  const prevQuarter = useMemo(() => {
    if (!quarter || !allQuarters) return null;
    return (
      allQuarters
        .filter((q) => q.end_date < quarter.start_date)
        .sort((a, b) => (a.end_date < b.end_date ? 1 : -1))[0] || null
    );
  }, [quarter, allQuarters]);

  const prevGoalsQ = useGoals(prevQuarter?.id);
  const prevActsQ = useActivities(prevQuarter?.id);

  if (!quarter) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const inProgress = quarter.status === "active";
  const accent = quarter.accent_color || "violet";
  const today = todayKey(tz);
  const upTo = inProgress ? today : quarter.end_date;
  const progress = quarterProgress(quarter.start_date, quarter.end_date, today);
  const actComp = activityCompletion(dayMap, upTo);
  const classes = dayClassifications(dayMap, upTo);
  const goalsCompleted = goals.filter((g) => g.status === "completed").length;
  const goalsTotal = goals.length;
  const totalDays = quarterDayCount(quarter.start_date, quarter.end_date);
  const selKey = selectedKey || (inProgress ? today : quarter.start_date);

  return (
    <div className="space-y-6 sm:space-y-8">
      <Link
        to="/past-quarters"
        className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Past quarters
      </Link>

      <PageHeader
        eyebrow={inProgress ? "In progress" : "Completed"}
        title={quarter.name}
        meta={
          <span className="tabular-nums">
            {format(parseISO(quarter.start_date), "MMM d")} –{" "}
            {format(parseISO(quarter.end_date), "MMM d, yyyy")} · {totalDays}{" "}
            days
          </span>
        }
        actions={
          <Button variant="outline" onClick={() => setSummaryOpen(true)}>
            <ScrollText className="h-4 w-4" /> Summary
          </Button>
        }
      />

      <section className="surface-card p-5 sm:p-6">
        <h2 className="section-title mb-4">The 90 days</h2>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <QuarterGrid
            quarter={quarter}
            dayMap={dayMap}
            accent={accent}
            todayKeyStr={today}
            selectedKey={selKey}
            onSelect={setSelectedKey}
            className="max-w-[34rem]"
          />
          <DayInspector
            dateKey={selKey}
            dayData={dayMap[selKey]}
            todayKeyStr={today}
          />
        </div>
      </section>

      <StatStrip
        items={[
          {
            label: inProgress ? "Day" : "Length",
            value: inProgress
              ? `${progress.dayNumber}/${totalDays}`
              : `${totalDays} days`,
          },
          {
            label: "Goals complete",
            value: goalsTotal ? `${goalsCompleted}/${goalsTotal}` : "—",
            sub: goalsTotal ? `${pct(goalsCompleted / goalsTotal)}%` : "none set",
            accent: true,
          },
          {
            label: "Activities done",
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

      <section className="surface-card p-5 sm:p-6">
        <h2 className="section-title">Goals</h2>
        <ol className="mt-3 divide-y divide-border">
          {goalsTotal === 0 && (
            <li className="py-6 text-sm text-muted-foreground">
              No goals were set for this quarter.
            </li>
          )}
          {goals.map((g, i) => (
            <li key={g.id} className="flex min-h-[3rem] items-center gap-3 py-1.5">
              <span className="w-5 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 break-words text-[0.95rem]",
                  g.status === "abandoned" &&
                    "text-muted-foreground line-through decoration-muted-foreground/50",
                )}
              >
                {g.title}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs",
                  g.status === "completed"
                    ? "font-medium text-primary"
                    : "text-muted-foreground",
                )}
              >
                {g.status === "completed"
                  ? "Completed"
                  : g.status === "abandoned"
                    ? "Abandoned"
                    : "Not finished"}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {prevQuarter && (
        <QuarterComparison
          prev={prevQuarter}
          prevGoals={prevGoalsQ.data || []}
          prevActs={prevActsQ.data || []}
          cur={quarter}
          curGoals={goals}
          curActs={activities}
        />
      )}

      <SummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        quarter={quarter}
        goals={goals}
        activities={activities}
        accent={accent}
      />
    </div>
  );
}
