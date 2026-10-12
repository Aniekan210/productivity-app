import React from "react";
import Wordmark from "@/components/Wordmark";

// Deterministic "filled-in quarter" pattern for the sign-in page: 13 weeks,
// getting more consistent towards the end. Purely decorative.
const ART = Array.from({ length: 13 * 7 }, (_, i) => {
  const week = Math.floor(i / 7);
  const noise = ((i * 37) % 11) / 10;
  const v = week / 12 + noise * 0.55 - 0.25;
  return v < 0.05 ? 0.08 : Math.min(1, 0.2 + v * 0.8);
});

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <Wordmark className="text-5xl sm:text-6xl" />

        <div
          aria-hidden="true"
          className="mt-8 grid grid-flow-col grid-rows-7 gap-[3px]"
          style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
        >
          {ART.map((o, i) => (
            <span
              key={i}
              className="aspect-square rounded-[calc(var(--radius)*0.3)]"
              style={{ backgroundColor: `hsl(var(--brand) / ${o})` }}
            />
          ))}
        </div>

        <h1 className="mt-8 font-display text-[1.75rem] font-medium leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}

        <div className="mt-8">{children}</div>
      </div>
      {footer && (
        <p className="text-center text-xs text-muted-foreground">{footer}</p>
      )}
    </div>
  );
}
