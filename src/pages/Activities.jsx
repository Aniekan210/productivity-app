import React, { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarCheck, Plus, Repeat, Pencil, Trash2 } from "lucide-react";
import {
  useActiveQuarter,
  useActivities,
  useToggleActivity,
  useSaveActivity,
  useDeleteActivity,
  useBulkCreateActivities,
} from "@/lib/useData";
import { buildDayMap, todayKey, dayKey } from "@/lib/quarterUtils";
import QuarterCalendar from "@/components/QuarterCalendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import EmptyState from "@/components/EmptyState";
import ActivityDialog from "@/components/ActivityDialog";
import RecurDialog from "@/components/RecurDialog";
import { cn } from "@/lib/utils";

export default function Activities() {
  const { active } = useActiveQuarter();
  const { data: activities } = useActivities(active?.id);
  const toggle = useToggleActivity(active?.id);
  const save = useSaveActivity();
  const remove = useDeleteActivity();
  const bulk = useBulkCreateActivities();

  const [selected, setSelected] = useState(new Date());
  const [singleOpen, setSingleOpen] = useState(false);
  const [recurOpen, setRecurOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const dayMap = useMemo(() => buildDayMap(activities), [activities]);
  const selKey = dayKey(selected);
  const selDay = dayMap[selKey];

  if (!active) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No active quarter"
        description="Your quarter is being set up — check back in a moment."
      />
    );
  }

  const selActs = selDay?.activities || [];
  const completed = selDay?.completed || 0;
  const total = selDay?.planned || 0;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const isToday = isSameDay(selected, new Date());

  const openNew = () => {
    setEditing(null);
    setSingleOpen(true);
  };
  const openEdit = (a) => {
    setEditing(a);
    setSingleOpen(true);
  };
  const handleSave = (data) => {
    if (editing) save.mutate({ id: editing.id, quarter_id: active.id, data });
    else
      save.mutate({
        quarter_id: active.id,
        data: { ...data, completed: false },
      });
  };
  const handleRecur = ({ title, dates }) => {
    const rid = `r_${Date.now()}`;
    bulk.mutate({
      quarter_id: active.id,
      records: dates.map((d) => ({
        quarter_id: active.id,
        date: d,
        title,
        completed: false,
        recurrence_id: rid,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Activities
          </h1>
          <p className="text-sm text-muted-foreground">
            {active.name} · plan each day as it comes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRecurOpen(true)}>
            <Repeat className="mr-1 h-4 w-4" /> Recurring
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </header>

      {/* Big calendar on top */}
      <section className="surface-card p-5">
        <QuarterCalendar
          selected={selected}
          onSelect={setSelected}
          quarterStart={active.start_date}
          quarterEnd={active.end_date}
        />
      </section>

      {/* Tasks below */}
      <section className="surface-card p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isToday ? "Today" : "Selected day"}
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {format(selected, "EEEE, MMM d")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {total
              ? `${completed} of ${total} done · ${rate}%`
              : "nothing planned yet"}
          </p>
        </div>

        {total > 0 && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${rate}%` }}
            />
          </div>
        )}

        <div className="mt-5 space-y-2">
          {total === 0 && (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing planned for {format(selected, "MMM d")}. Add an activity
                to get started.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={openNew}
              >
                <Plus className="mr-1 h-4 w-4" /> Add an activity
              </Button>
            </div>
          )}
          {selActs.map((a) => (
            <div
              key={a.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5"
            >
              <Checkbox
                checked={a.completed}
                onCheckedChange={(v) =>
                  toggle.mutate({ id: a.id, completed: !!v })
                }
              />
              <span
                className={cn(
                  "flex-1 text-base",
                  a.completed && "text-muted-foreground line-through",
                )}
              >
                {a.title}
              </span>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => openEdit(a)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    remove.mutate({ id: a.id, quarter_id: active.id })
                  }
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ActivityDialog
        open={singleOpen}
        onOpenChange={setSingleOpen}
        activity={editing}
        defaultDate={selKey}
        onSave={handleSave}
      />
      <RecurDialog
        open={recurOpen}
        onOpenChange={setRecurOpen}
        quarter={active}
        onSave={handleRecur}
      />
    </div>
  );
}
