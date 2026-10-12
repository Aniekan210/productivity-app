import React, { useState, useMemo } from "react";
import { ScrollText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useActiveQuarter, useGoals, useActivities } from "@/lib/useData";
import {
  buildDayMap,
  quarterProgress,
  todayKey,
  dayClassifications,
  activityCompletion,
  pct,
  quarterDayCount,
} from "@/lib/quarterUtils";
import QuarterGrid from "@/components/QuarterGrid";
import DayInspector from "@/components/DayInspector";
import TodayActivities from "@/components/TodayActivities";
import GoalsSection from "@/components/GoalsSection";
import StatStrip from "@/components/StatStrip";
import PageHeader from "@/components/PageHeader";
import SummaryDialog from "@/components/SummaryDialog";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const tz = user?.timezone;
  const accent = user?.primary || user?.accent || "violet";
  const { active, isLoading } = useActiveQuarter();
  const [selectedKey, setSelectedKey] = useState(todayKey(tz));
  const [summaryOpen, setSummaryOpen] = useState(false);

  const goalsQ = useGoals(active?.id);
  const activitiesQ = useActivities(active?.id);

  const goals = goalsQ.data || [];
  const activities = activitiesQ.data || [];

  const dayMap = useMemo(() => buildDayMap(activities), [activities]);
  const today = todayKey(tz);
  const progress = useMemo(
    () =>
      active
        ? quarterProgress(active.start_date, active.end_date, today)
        : null,
    [active, today],
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  // The app auto-creates the active quarter; if it's not here yet, it's being set up.
  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">
          Setting up your quarter…
        </p>
      </div>
    );
  }

  const todays = dayMap[today]?.activities || [];
  const actComp = activityCompletion(dayMap, today);
  const classes = dayClassifications(dayMap, today);
  const goalsCompleted = goals.filter((g) => g.status === "completed").length;
  const goalsTotal = goals.length;
  const totalDays = quarterDayCount(active.start_date, active.end_date);
  const selectedData = dayMap[selectedKey];
  const inspectingAnotherDay = selectedKey && selectedKey !== today;
  const freshQuarter = goalsTotal === 0;

  const daysLeft = totalDays - progress.dayNumber;
  const range = `${format(parseISO(active.start_date), "MMM d")} – ${format(
    parseISO(active.end_date),
    "MMM d, yyyy",
  )}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow={range}
        title={active.name}
        meta={
          daysLeft > 0
            ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go`
            : "Last day of the quarter"
        }
        actions={
          <div className="flex w-full items-end justify-between gap-4 sm:w-auto sm:justify-end">
            <Button variant="outline" onClick={() => setSummaryOpen(true)}>
              <ScrollText className="h-4 w-4" /> Summary
            </Button>
            <div className="text-right tabular-nums">
              <p className="text-3xl font-semibold leading-none tracking-tight text-primary">
                Day {progress.dayNumber}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                of {totalDays} days
              </p>
            </div>
          </div>
        }
      />

      {freshQuarter && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">A fresh 90 days.</p>
            <p className="text-sm text-muted-foreground">
              Decide what this quarter is for, then plan today.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/goals">
              Set your goals <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Timeline */}
      <section className="surface-card p-5 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="section-title">The 90 days</h2>
          <span className="text-xs text-muted-foreground">
            Tap a day to look back
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <QuarterGrid
            quarter={active}
            dayMap={dayMap}
            accent={accent}
            todayKeyStr={today}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            className="max-w-[34rem]"
          />
          <DayInspector
            dateKey={selectedKey}
            dayData={selectedData}
            todayKeyStr={today}
            className={cn(!inspectingAnotherDay && "hidden lg:block")}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TodayActivities quarter_id={active.id} todays={todays} tz={tz} />
        <GoalsSection goals={goals} />
      </div>

      <StatStrip
        items={[
          {
            label: "Activities done",
            value: actComp.planned ? `${pct(actComp.rate)}%` : "—",
            sub: `${actComp.completed} of ${actComp.planned} so far`,
            accent: true,
          },
          {
            label: "Perfect days",
            value: classes.perfect,
            sub: "everything done",
          },
          {
            label: "Goals complete",
            value: goalsTotal ? `${goalsCompleted}/${goalsTotal}` : "—",
            sub: goalsTotal
              ? `${pct(goalsCompleted / goalsTotal)}%`
              : "none set yet",
          },
          {
            label: "Missed days",
            value: classes.missed,
            sub: "planned, nothing done",
          },
        ]}
      />

      <SummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        quarter={active}
        goals={goals}
        activities={activities}
        accent={accent}
      />
    </div>
  );
}
