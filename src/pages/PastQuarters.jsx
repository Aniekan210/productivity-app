import React from "react";
import { Link } from "react-router-dom";
import { History, ArrowRight } from "lucide-react";
import { useQuarters } from "@/lib/useData";
import { parseISO } from "date-fns";
import { fmtDate, quarterDayCount } from "@/lib/quarterUtils";
import EmptyState from "@/components/EmptyState";

export default function PastQuarters() {
  const { data: quarters, isLoading } = useQuarters();
  const list = (quarters || [])
    .filter((q) => q.status === "completed")
    .slice()
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Past Quarters
        </h1>
        <p className="text-sm text-muted-foreground">
          Your completed quarters, preserved as a historical record. New
          quarters start automatically each calendar quarter.
        </p>
      </header>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={History}
          title="No past quarters yet"
          description="Once this quarter ends and the next one begins, the completed quarter will appear here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((q) => (
            <Link
              key={q.id}
              to={`/quarter/${q.id}`}
              className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div>
                <p className="text-base font-semibold">{q.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fmtDate(parseISO(q.start_date))} –{" "}
                  {fmtDate(parseISO(q.end_date))}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {quarterDayCount(q.start_date, q.end_date)} days
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
