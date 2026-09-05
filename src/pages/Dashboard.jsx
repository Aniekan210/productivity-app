import React, { useState, useMemo } from "react";
import { Sparkles, ScrollText, ArrowRight } from "lucide-react";
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
  fmtDate,
  quarterDayCount,
} from "@/lib/quarterUtils";
import QuarterGrid from "@/components/QuarterGrid";
import DayInspector from "@/components/DayInspector";
import TodayActivities from "@/components/TodayActivities";
import GoalsSection from "@/components/GoalsSection";
import StatCard from "@/components/StatCard";
import SummaryDialog from "@/components/SummaryDialog";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current Quarter
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {active.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fmtDate(parseISO(active.start_date))} –{" "}
            {fmtDate(parseISO(active.end_date))}
          </p>
        </div>
        <div className="flex items-end gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSummaryOpen(true)}
          >
            <ScrollText className="mr-1 h-4 w-4" /> View summary
          </Button>
          <div className="text-right">
            <p
              className="text-3xl font-semibold"
              style={{ color: "hsl(var(--brand))" }}
            >
              Day {progress.dayNumber}
            </p>
            <p className="text-xs text-muted-foreground">of {totalDays} days</p>
          </div>
        </div>
      </header>

      {freshQuarter && (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 border-primary/30 p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                New quarter — define it yourself
              </p>
              <p className="text-xs text-muted-foreground">
                A fresh 90 days. Set your goals and today's activities to get
                started.
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/goals">
              Set goals <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Timeline */}
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">90-Day Timeline</h2>
          <span className="text-xs text-muted-foreground">
            Tap a day to inspect
          </span>
        </div>
        <QuarterGrid
          quarter={active}
          dayMap={dayMap}
          accent={accent}
          todayKeyStr={today}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
        {inspectingAnotherDay && (
          <div className="mt-4">
            <DayInspector
              dateKey={selectedKey}
              dayData={selectedData}
              todayKeyStr={today}
            />
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <TodayActivities quarter_id={active.id} todays={todays} tz={tz} />
        <GoalsSection goals={goals} quarterName={active.name} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Activity completion"
          value={actComp.planned ? `${pct(actComp.rate)}%` : "—"}
          sub={`${actComp.completed}/${actComp.planned} done`}
          accent
        />
        <StatCard
          label="Perfect days"
          value={classes.perfect}
          sub="all activities done"
        />
        <StatCard
          label="Goals completed"
          value={goalsTotal ? `${goalsCompleted}/${goalsTotal}` : "—"}
          sub={
            goalsTotal ? `${pct(goalsCompleted / goalsTotal)}%` : "no goals yet"
          }
          accent
        />
        <StatCard
          label="Missed days"
          value={classes.missed}
          sub="planned, none done"
        />
      </div>

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
