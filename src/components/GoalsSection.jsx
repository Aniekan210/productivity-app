import React from "react";
import { Check, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GoalsSection({ goals, quarterName }) {
  const total = goals.length;
  const completed = goals.filter((g) => g.status === "completed").length;
  const active = goals.filter((g) => g.status === "active").length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">{quarterName} Goals</h2>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span style={{ color: "hsl(var(--brand))" }} className="font-semibold">
          {completed}/{total} completed
        </span>
        <span>·</span>
        <span>{active} active</span>
        <span>·</span>
        <span>{total ? `${rate}%` : "—"}</span>
      </div>

      <div className="mt-4 space-y-1.5">
        {total === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            You haven't set any goals for this quarter yet.
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
                g.status === "completed" &&
                  "text-muted-foreground line-through",
                g.status === "abandoned" &&
                  "text-muted-foreground line-through opacity-60",
              )}
            >
              {g.title}
            </span>
            {g.status === "abandoned" && (
              <span className="text-xs text-muted-foreground">abandoned</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
