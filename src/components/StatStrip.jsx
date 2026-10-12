import React from "react";
import { cn } from "@/lib/utils";

// A single ruled strip of figures instead of a row of separate boxes.
// items: [{ label, value, sub, accent }]
export default function StatStrip({ items, className }) {
  const three = items.length === 3;
  return (
    <dl
      className={cn(
        "grid overflow-hidden rounded-lg border border-border bg-card",
        three ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4",
        className,
      )}
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "flex min-w-0 flex-col gap-1 border-border p-3.5 sm:p-5",
            three
              ? i > 0 && "border-l"
              : cn(
                  // 2x2 on phones, one row from md up
                  i % 2 === 1 && "border-l",
                  i >= 2 && "border-t md:border-t-0",
                  i === 2 && "md:border-l",
                ),
          )}
        >
          <dt className="text-[0.8rem] leading-snug text-muted-foreground">
            {s.label}
          </dt>
          <dd
            className={cn(
              "text-[1.6rem] font-semibold leading-none tracking-tight tabular-nums sm:text-[1.85rem]",
              s.accent && "text-primary",
            )}
          >
            {s.value}
          </dd>
          {s.sub && (
            <dd className="text-xs leading-snug text-muted-foreground tabular-nums">
              {s.sub}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
