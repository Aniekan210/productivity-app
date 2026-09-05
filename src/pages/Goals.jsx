import React, { useState } from "react";
import {
  Target,
  Plus,
  Pencil,
  Check,
  RotateCcw,
  Ban,
  Trash2,
  Flag,
} from "lucide-react";
import {
  useActiveQuarter,
  useGoals,
  useSaveGoal,
  useDeleteGoal,
} from "@/lib/useData";
import { todayKey, pct } from "@/lib/quarterUtils";
import GoalDialog from "@/components/GoalDialog";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            {active.name} · 6 is the recommended number — set as few or as many
            as you like.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> New goal
        </Button>
      </header>

      {/* Summary banner */}
      <section className="surface-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Progress
            </p>
            <p
              className="font-display text-3xl font-semibold tracking-tight"
              style={{ color: "hsl(var(--brand))" }}
            >
              {total ? `${completed}/${total}` : "—"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {total ? `${rate}% complete` : "no goals yet"} · {activeCount}{" "}
              active{abandoned ? ` · ${abandoned} abandoned` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Completed
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full border border-border" />{" "}
              Active
            </span>
            {abandoned > 0 && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-muted" /> Abandoned
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>
      </section>

      {total === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set your first quarterly goal to give your 90 days direction."
          action={
            <Button onClick={openNew}>
              <Plus className="mr-1 h-4 w-4" /> Add a goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((g) => (
            <div key={g.id} className="group surface-card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    g.status === "completed"
                      ? setStatus(g, "active")
                      : setStatus(g, "completed")
                  }
                  className={cn(
                    "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-primary-foreground transition-colors",
                    g.status === "completed"
                      ? "border-transparent bg-primary"
                      : "border-border hover:border-primary",
                  )}
                  aria-label="Toggle complete"
                >
                  {g.status === "completed" && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-base font-medium leading-snug",
                      (g.status === "completed" || g.status === "abandoned") &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {g.title}
                  </p>
                  {g.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {g.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {g.status === "completed" && (
                    <button
                      onClick={() => setStatus(g, "active")}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Reopen"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(g)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {g.status === "active" && (
                    <button
                      onClick={() => setConfirm({ type: "abandon", goal: g })}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Abandon"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setConfirm({ type: "delete", goal: g })}
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {g.status === "active" && (
                  <Badge variant="secondary" className="gap-1">
                    <Flag className="h-3 w-3" /> Active
                  </Badge>
                )}
                {g.status === "completed" && (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Check className="h-3 w-3" /> Completed
                  </Badge>
                )}
                {g.status === "abandoned" && (
                  <Badge variant="outline">Abandoned</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
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
