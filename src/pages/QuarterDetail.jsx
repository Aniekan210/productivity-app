import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { parseISO } from "date-fns";
import { ArrowLeft, ScrollText, Check, Target } from "lucide-react";
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
  fmtDate,
  quarterDayCount,
  pct,
} from "@/lib/quarterUtils";
import QuarterGrid from "@/components/QuarterGrid";
import DayInspector from "@/components/DayInspector";
import QuarterComparison from "@/components/QuarterComparison";
import SummaryDialog from "@/components/SummaryDialog";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/past-quarters"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Past Quarters
        </Link>
        <Button variant="outline" onClick={() => setSummaryOpen(true)}>
          <ScrollText className="mr-1 h-4 w-4" /> View summary
        </Button>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {quarter.name}
          </h1>
          <Badge
            variant={inProgress ? "default" : "secondary"}
            className={inProgress ? "bg-primary text-primary-foreground" : ""}
          >
            {inProgress ? "In progress" : "Completed"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {fmtDate(parseISO(quarter.start_date))} –{" "}
          {fmtDate(parseISO(quarter.end_date))} · {totalDays} days
        </p>
      </header>

      <section className="surface-card p-5">
        <h2 className="mb-4 text-base font-semibold">90-Day Timeline</h2>
        <QuarterGrid
          quarter={quarter}
          dayMap={dayMap}
          accent={accent}
          todayKeyStr={today}
          selectedKey={selKey}
          onSelect={setSelectedKey}
        />
        <div className="mt-4">
          <DayInspector
            dateKey={selKey}
            dayData={dayMap[selKey]}
            todayKeyStr={today}
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Day"
          value={
            inProgress
              ? `${progress.dayNumber}/${totalDays}`
              : `${totalDays}/${totalDays}`
          }
          accent
        />
        <StatCard
          label="Goals"
          value={goalsTotal ? `${goalsCompleted}/${goalsTotal}` : "—"}
          sub={goalsTotal ? `${pct(goalsCompleted / goalsTotal)}%` : ""}
          accent
        />
        <StatCard
          label="Activity"
          value={actComp.planned ? `${pct(actComp.rate)}%` : "—"}
          sub={`${actComp.completed}/${actComp.planned}`}
          accent
        />
        <StatCard label="Perfect days" value={classes.perfect} />
      </div>

      <section className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Goals</h2>
        </div>
        <div className="mt-4 space-y-1.5">
          {goalsTotal === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No goals were set for this quarter.
            </p>
          )}
          {goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2"
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full border text-white",
                  g.status === "completed"
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {g.status === "completed" && <Check className="h-3 w-3" />}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm",
                  (g.status === "completed" || g.status === "abandoned") &&
                    "text-muted-foreground line-through",
                )}
              >
                {g.title}
              </span>
              {g.status === "abandoned" && (
                <Badge variant="outline">abandoned</Badge>
              )}
              {g.status === "completed" && (
                <Badge className="bg-primary text-primary-foreground">
                  completed
                </Badge>
              )}
            </div>
          ))}
        </div>
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
