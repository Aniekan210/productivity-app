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
    <section className="surface-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Today's Activities</h2>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(today), "EEEE, MMM d")}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-lg font-semibold"
            style={{ color: "hsl(var(--brand))" }}
          >
            {total ? `${completed}/${total}` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {total ? `${rate}% complete` : "nothing planned"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {total === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing planned for today. Add your first activity below.
          </p>
        )}
        {todays.map((a) => (
          <div
            key={a.id}
            className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
          >
            <Checkbox
              checked={a.completed}
              onCheckedChange={(v) =>
                toggle.mutate({ id: a.id, completed: !!v })
              }
              disabled={toggle.isPending}
            />
            {editingId === a.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={saveEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    a.completed && "text-muted-foreground line-through",
                  )}
                >
                  {a.title}
                </span>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(a)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove.mutate({ id: a.id, quarter_id })}
                    className="rounded p-1.5 text-muted-foreground hover:bg-background hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addToday()}
          placeholder="Add an activity for today…"
          className="h-9"
        />
        <Button
          onClick={addToday}
          size="sm"
          disabled={!newTitle.trim() || save.isPending}
        >
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>
    </section>
  );
}
