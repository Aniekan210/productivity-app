import React from "react";
import { Link } from "react-router-dom";
import { History, ArrowRight } from "lucide-react";
import { parseISO, format } from "date-fns";
import { useQuarters } from "@/lib/useData";
import { quarterDayCount } from "@/lib/quarterUtils";
import { intensityColor } from "@/lib/theme";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";

export default function PastQuarters() {
  const { data: quarters, isLoading } = useQuarters();
  const list = (quarters || [])
    .filter((q) => q.status === "completed")
    .slice()
    .sort((a, b) => (a.start_date < b.start_date ? 1 : -1));

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Past quarters"
        meta="Every finished quarter, kept as a record. A new one starts on its own each calendar quarter."
      />

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing here yet"
          description="When this quarter ends, it'll be filed here so you can look back on it."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {list.map((q) => (
            <li key={q.id}>
              <Link
                to={`/quarter/${q.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 sm:px-6 sm:py-5"
              >
                <span
                  aria-hidden="true"
                  className="h-10 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: intensityColor(q.accent_color || "violet", 4),
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-medium tracking-tight">
                    {q.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                    {format(parseISO(q.start_date), "MMM d")} –{" "}
                    {format(parseISO(q.end_date), "MMM d, yyyy")} ·{" "}
                    {quarterDayCount(q.start_date, q.end_date)} days
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
