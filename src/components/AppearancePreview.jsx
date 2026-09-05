import React from "react";
import { Check } from "lucide-react";
import { resolveColor } from "@/lib/theme";

// A live mock of the app that reflects the current appearance (theme tokens).
// Place next to AppearanceControls so changes are visible immediately.
// @ts-ignore
export default function AppearancePreview({ value }) {
  const p = resolveColor(value.primary);
  const brand = `hsl(${p.channels})`;
  const cells = [0, 1, 2, 3, 4];
  const opacities = [0.14, 0.34, 0.56, 0.76, 1];

  return (
    <div className="surface-card overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold leading-none">
            3/6/9
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Q3 2026 · Day 42</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-medium"
          style={{ background: `hsl(${p.channels} / 0.14)`, color: brand }}
        >
          Day 42 / 90
        </span>
      </div>

      {/* mini timeline */}
      <div className="mt-4 flex gap-1.5">
        {cells.map((lvl, i) => (
          <span
            key={i}
            className="h-6 w-6 rounded-[5px]"
            style={{
              backgroundColor: `hsl(${p.channels} / ${opacities[lvl]})`,
              boxShadow:
                i === 2 ? "0 0 0 2px hsl(var(--foreground))" : undefined,
            }}
          />
        ))}
        <span className="ml-1 self-center text-[10px] text-muted-foreground">
          today
        </span>
      </div>

      {/* a primary button + a badge */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-xs font-medium text-primary-foreground"
          style={{ background: brand }}
        >
          Primary action
        </button>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-primary-foreground"
          style={{ background: brand }}
        >
          <Check className="h-3 w-3" /> Done
        </span>
      </div>

      {/* a task row */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center gap-2 rounded-lg px-1 py-1.5">
          <span
            className="grid h-4 w-4 place-items-center rounded-full text-white"
            style={{ background: brand }}
          >
            <Check className="h-2.5 w-2.5" />
          </span>
          <span className="text-sm text-muted-foreground line-through">
            Review notes
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-1 py-1.5">
          <span className="grid h-4 w-4 place-items-center rounded-full border border-border" />
          <span className="text-sm">Write the brief</span>
        </div>
      </div>
    </div>
  );
}
