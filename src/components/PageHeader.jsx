import React from "react";
import { cn } from "@/lib/utils";

// Shared page heading: serif title, a quiet meta line, actions on the right
// (stacked under the title on narrow screens).
export default function PageHeader({ eyebrow, title, meta, actions, className }) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-sm text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="font-display text-[2rem] font-medium leading-[1.1] tracking-tight sm:text-[2.5rem]">
          {title}
        </h1>
        {meta && (
          <div className="mt-2 text-sm text-muted-foreground">{meta}</div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
