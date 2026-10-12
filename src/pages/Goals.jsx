import React, { useState } from "react";
import { Target, Plus, Pencil, Check, RotateCcw, Ban, Trash2 } from "lucide-react";
import {
  useActiveQuarter,
  useGoals,
  useSaveGoal,
  useDeleteGoal,
} from "@/lib/useData";
import { todayKey } from "@/lib/quarterUtils";
import GoalDialog from "@/components/GoalDialog";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const STATUS_ORDER = { completed: 0, active: 1, abandoned: 2 };

export default function Goals() {
  const { active } = useActiveQuarter();
  const { data: goals } = useGoals(active?.id);
  const saveGoal = useSaveGoal();
  const deleteGoal = useDeleteGoal();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, goal }

  const list = goals || [];
  const completed = list.filter((g) => g.status === "completed").length;
  const activeCount = list.filter((g) => g.status === "active").length;
  const abandoned = list.filter((g) => g.status === "abandoned").length;
  const total = list.length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  if (!active) {
    return (
      <EmptyState
        icon={Target}
        title="No active quarter"
        description="Your quarter is being set up — check back in a moment."
      />
    );
  }

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (g) => {
    setEditing(g);
    setDialogOpen(true);
  };
  const handleSave = (data) => {
    if (editing)
      saveGoal.mutate({ id: editing.id, quarter_id: active.id, data });
    else
      saveGoal.mutate({
        quarter_id: active.id,
        data: { ...data, status: "active" },
      });
  };

  const setStatus = (g, status) => {
    const patch = { status };
    if (status === "completed") patch.completed_date = todayKey();
    if (status === "abandoned") patch.abandoned_date = todayKey();
    if (status === "active") {
      // Reopened or restored: clear the old outcome date.
      patch.completed_date = null;
      patch.abandoned_date = null;
    }
    saveGoal.mutate({ id: g.id, quarter_id: active.id, data: patch });
    if (status === "completed") toast({ title: "Goal completed 🎉" });
  };

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "delete")
      deleteGoal.mutate({ id: confirm.goal.id, quarter_id: active.id });
    else setStatus(confirm.goal, "abandoned");
    setConfirm(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow={active.name}
        title="Goals"
        meta="Six is the recommended number. Set as few or as many as you like."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New goal
          </Button>
        }
      />

      {total > 0 && (
        <section aria-label="Progress" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm text-muted-foreground tabular-nums">
              <span className="font-display text-2xl font-medium text-foreground">
                {completed}
              </span>{" "}
              of {total} complete
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {activeCount} in progress
              {abandoned ? ` · ${abandoned} abandoned` : ""} · {rate}%
            </p>
          </div>
          {/* One segment per goal, so the bar reads as the goals themselves. */}
          <div className="flex gap-1">
            {[...list]
              .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
              .map((g) => (
                <span
                  key={g.id}
                  title={g.title}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    g.status === "completed" && "bg-primary",
                    g.status === "active" && "bg-muted-foreground/20",
                    g.status === "abandoned" &&
                      "bg-[repeating-linear-gradient(135deg,hsl(var(--muted-foreground)/0.25)_0_3px,transparent_3px_6px)]",
                  )}
                />
              ))}
          </div>
        </section>
      )}

      {total === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="What would make this quarter a success? Write it down."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Add your first goal
            </Button>
          }
        />
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {list.map((g, i) => {
            const done = g.status === "completed";
            const dropped = g.status === "abandoned";
            return (
              <li
                key={g.id}
                className={cn(
                  "group surface-card flex gap-4 p-5 transition-colors",
                  dropped && "bg-transparent",
                )}
              >
                <span
                  className={cn(
                    "font-display text-[1.75rem] font-medium leading-none tabular-nums",
                    done ? "text-primary" : "text-muted-foreground/40",
                  )}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "break-words text-base font-medium leading-snug",
                      (done || dropped) &&
                        "text-muted-foreground line-through decoration-muted-foreground/50",
                    )}
                  >
                    {g.title}
                  </p>
                  {g.description && (
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {g.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    {dropped ? (
                      <span className="text-xs text-muted-foreground">
                        Abandoned
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setStatus(g, done ? "active" : "completed")
                        }
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
                          done
                            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-border hover:border-primary hover:text-primary",
                        )}
                        aria-pressed={done}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        {done ? "Completed" : "Mark complete"}
                      </button>
                    )}
                    <div className="row-actions ml-auto">
                      {dropped && (
                        <button
                          onClick={() => setStatus(g, "active")}
                          className="icon-btn"
                          title="Restore"
                          aria-label={`Restore "${g.title}"`}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(g)}
                        className="icon-btn"
                        title="Edit"
                        aria-label={`Edit "${g.title}"`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {g.status === "active" && (
                        <button
                          onClick={() => setConfirm({ type: "abandon", goal: g })}
                          className="icon-btn"
                          title="Abandon"
                          aria-label={`Abandon "${g.title}"`}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirm({ type: "delete", goal: g })}
                        className="icon-btn hover:text-destructive"
                        title="Delete"
                        aria-label={`Delete "${g.title}"`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editing}
        onSave={handleSave}
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "delete"
                ? "Delete this goal?"
                : "Abandon this goal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "delete"
                ? "This goal was part of the commitment you made for this quarter. Deleting it removes it permanently. Take a moment to consider whether your priorities have genuinely changed."
                : "This goal was part of the commitment you made for this quarter. Abandoning it keeps it in your quarter history as abandoned. Only do this if your priorities have genuinely changed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirm}
              className={
                confirm?.type === "delete"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirm?.type === "delete" ? "Delete" : "Abandon"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
