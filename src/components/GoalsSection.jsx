import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Compact, read-only goal list for the dashboard.
export default function GoalsSection({ goals }) {
  const total = goals.length;
  const completed = goals.filter((g) => g.status === "completed").length;

  return (
    <section className="surface-card flex flex-col p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="section-title">Goals</h2>
          <p className="text-sm text-muted-foreground">
            {total
              ? `${completed} of ${total} complete`
              : "None set for this quarter"}
          </p>
        </div>
        <Link
          to="/goals"
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Manage <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ol className="mt-3 flex-1 divide-y divide-border">
        {total === 0 && (
          <li className="py-6 text-sm text-muted-foreground">
            Six is the sweet spot. Even one is a start.
          </li>
        )}
        {goals.map((g, i) => (
          <li key={g.id} className="flex min-h-[3rem] items-center gap-3 py-1.5">
            <span className="w-5 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 break-words text-[0.95rem]",
                g.status === "completed" &&
                  "text-muted-foreground line-through decoration-muted-foreground/50",
                g.status === "abandoned" &&
                  "text-muted-foreground/60 line-through decoration-muted-foreground/40",
              )}
            >
              {g.title}
            </span>
            {g.status === "completed" && (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-sm bg-primary text-primary-foreground">
                <Check className="h-3 w-3" strokeWidth={3} />
                <span className="sr-only">Completed</span>
              </span>
            )}
            {g.status === "abandoned" && (
              <span className="shrink-0 text-xs text-muted-foreground">
                Abandoned
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
