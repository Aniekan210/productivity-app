import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, sub, accent, className }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold tracking-tight"
        style={accent ? { color: `hsl(var(--brand))` } : undefined}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
