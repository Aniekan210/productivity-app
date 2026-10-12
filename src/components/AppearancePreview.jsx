import React from "react";
import { Check } from "lucide-react";
import { resolveColor } from "@/lib/theme";
import Wordmark from "@/components/Wordmark";

const WEEK_LEVELS = [0.34, 1, 0.56, 1, 0.76, 0.14, 1];
const OPACITY = [0.14, 0.34, 0.56, 0.76, 1];

// A small live mock of the app using the chosen appearance. It reads the
// theme tokens applied to the document, plus the chosen color directly.
export default function AppearancePreview({ value }) {
  const p = resolveColor(value.primary);
  const brand = (o = 1) => `hsl(${p.channels} / ${o})`;

  return (
    <div className="surface-card overflow-hidden p-5">
      <div className="flex items-baseline justify-between">
        <Wordmark className="text-xl" />
        <span className="text-xs tabular-nums text-muted-foreground">
          Day 42 of 92
        </span>
      </div>

      <div
        className="mt-4 grid grid-flow-col grid-rows-3 gap-1"
        style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
        aria-hidden="true"
      >
        {Array.from({ length: 30 }, (_, i) => (
          <span
            key={i}
            className="aspect-square rounded-[calc(var(--radius)*0.4)]"
            style={{
              backgroundColor:
                i > 23
                  ? "hsl(var(--muted-foreground) / 0.12)"
                  : brand(OPACITY[(i * 7) % 5]),
              outline:
                i === 23 ? "1.5px solid hsl(var(--foreground) / 0.7)" : undefined,
              outlineOffset: 1.5,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 divide-y divide-border text-sm">
        <li className="flex items-center gap-2.5 py-2">
          <span
            className="grid h-[18px] w-[18px] place-items-center rounded-sm"
            style={{ background: brand(), color: "hsl(var(--primary-foreground))" }}
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
          </span>
          <span className="text-muted-foreground line-through decoration-muted-foreground/50">
            Review notes
          </span>
        </li>
        <li className="flex items-center gap-2.5 py-2">
          <span className="h-[18px] w-[18px] rounded-sm border-[1.5px] border-primary/70" />
          <span>Write the brief</span>
        </li>
      </ul>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium"
          style={{ background: brand(), color: "hsl(var(--primary-foreground))" }}
        >
          Add activity
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="text-base font-semibold text-primary">
            {WEEK_LEVELS.filter((l) => l === 1).length}
          </span>{" "}
          perfect days
        </span>
      </div>
    </div>
  );
}
