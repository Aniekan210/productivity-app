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
import { buildDayMap, dayKey } from "@/lib/quarterUtils";
import QuarterCalendar from "@/components/QuarterCalendar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
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
        recurrence_group: rid,
      })),
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow={active.name}
        title="Activities"
        meta="Plan each day as it comes."
        actions={
          <>
            <Button variant="outline" onClick={() => setRecurOpen(true)}>
              <Repeat className="h-4 w-4" /> Repeat
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Add activity
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <section className="surface-card p-4 sm:p-5 lg:sticky lg:top-8">
          <QuarterCalendar
            selected={selected}
            onSelect={setSelected}
            quarterStart={active.start_date}
            quarterEnd={active.end_date}
            dayMap={dayMap}
          />
        </section>

        <section className="surface-card p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                {isToday ? "Today" : format(selected, "EEEE")}
              </p>
              <h2 className="font-display text-[1.75rem] font-medium leading-tight tracking-tight">
                {format(selected, isToday ? "EEEE, MMMM d" : "MMMM d")}
              </h2>
            </div>
            {total > 0 && (
              <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                <span className="font-display text-xl font-medium text-foreground">
                  {completed}
                </span>
                /{total} · {rate}%
              </p>
            )}
          </div>

          {total > 0 && (
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${rate}%` }}
              />
            </div>
          )}

          {total === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nothing planned for {format(selected, "MMMM d")}.
              </p>
              <Button variant="outline" className="mt-4" onClick={openNew}>
                <Plus className="h-4 w-4" /> Add an activity
              </Button>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {selActs.map((a) => (
                <li
                  key={a.id}
                  className="group flex min-h-[3.25rem] items-center gap-3 py-2"
                >
                  <Checkbox
                    checked={a.completed}
                    onCheckedChange={(v) =>
                      toggle.mutate({ id: a.id, completed: !!v })
                    }
                    aria-label={`Mark "${a.title}" ${a.completed ? "not done" : "done"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "break-words text-[0.95rem]",
                        a.completed &&
                          "text-muted-foreground line-through decoration-muted-foreground/50",
                      )}
                    >
                      {a.title}
                    </p>
                    {a.description && (
                      <p className="mt-0.5 break-words text-sm text-muted-foreground">
                        {a.description}
                      </p>
                    )}
                  </div>
                  {a.recurrence_group && (
                    <Repeat
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70"
                      aria-label="Repeating"
                    />
                  )}
                  <div className="row-actions">
                    <button
                      onClick={() => openEdit(a)}
                      className="icon-btn"
                      aria-label={`Edit "${a.title}"`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        remove.mutate({ id: a.id, quarter_id: active.id })
                      }
                      className="icon-btn hover:text-destructive"
                      aria-label={`Delete "${a.title}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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
