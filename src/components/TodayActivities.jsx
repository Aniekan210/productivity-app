import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  useToggleActivity,
  useSaveActivity,
  useDeleteActivity,
} from "@/lib/useData";
import { todayKey } from "@/lib/quarterUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function TodayActivities({ quarter_id, todays, tz }) {
  const today = todayKey(tz);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const toggle = useToggleActivity(quarter_id);
  const save = useSaveActivity();
  const remove = useDeleteActivity();

  const completed = todays.filter((a) => a.completed).length;
  const total = todays.length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  const addToday = () => {
    if (!newTitle.trim()) return;
    save.mutate({
      quarter_id,
      data: {
        quarter_id,
        date: today,
        title: newTitle.trim(),
        completed: false,
      },
    });
    setNewTitle("");
  };
  const startEdit = (a) => {
    setEditingId(a.id);
    setEditTitle(a.title);
  };
  const saveEdit = () => {
    if (editTitle.trim())
      save.mutate({
        id: editingId,
        quarter_id,
        data: { title: editTitle.trim() },
      });
    setEditingId(null);
  };

  return (
    <section className="surface-card flex flex-col p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="section-title">Today</h2>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(today), "EEEE, MMMM d")}
          </p>
        </div>
        {total > 0 && (
          <p className="shrink-0 text-sm tabular-nums text-primary">
            <span className="text-xl font-semibold">
              {completed}
            </span>
            /{total}
          </p>
        )}
      </div>
      {total > 0 && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${rate}%` }}
          />
        </div>
      )}

      <ul className="mt-3 flex-1 divide-y divide-border">
        {total === 0 && (
          <li className="py-6 text-sm text-muted-foreground">
            Nothing planned yet. What would make today count?
          </li>
        )}
        {todays.map((a) => (
          <li key={a.id} className="group flex min-h-[3rem] items-center gap-3 py-1.5">
            <Checkbox
              checked={a.completed}
              onCheckedChange={(v) =>
                toggle.mutate({ id: a.id, completed: !!v })
              }
              disabled={toggle.isPending}
              aria-label={`Mark "${a.title}" ${a.completed ? "not done" : "done"}`}
            />
            {editingId === a.id ? (
              <form
                className="flex flex-1 items-center gap-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                  className="h-9"
                  aria-label="Activity title"
                  autoFocus
                />
                <Button type="submit" size="sm" variant="ghost">
                  Save
                </Button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setEditingId(null)}
                  aria-label="Cancel editing"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <>
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words text-[0.95rem] transition-colors",
                    a.completed &&
                      "text-muted-foreground line-through decoration-muted-foreground/50",
                  )}
                >
                  {a.title}
                </span>
                <div className="row-actions">
                  <button
                    onClick={() => startEdit(a)}
                    className="icon-btn"
                    aria-label={`Edit "${a.title}"`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove.mutate({ id: a.id, quarter_id })}
                    className="icon-btn hover:text-destructive"
                    aria-label={`Delete "${a.title}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addToday();
        }}
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add something for today"
          aria-label="New activity for today"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newTitle.trim() || save.isPending}
          aria-label="Add activity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}
