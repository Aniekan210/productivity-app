import React from "react";
import { cn } from "@/lib/utils";

// "3/6/9" set in the display serif, slashes in the brand color.
export default function Wordmark({ className }) {
  return (
    <span
      className={cn(
        "font-display font-semibold tracking-tight tabular-nums",
        className,
      )}
      aria-label="3/6/9"
    >
      3<span className="mx-[0.04em] font-normal text-primary">/</span>6
      <span className="mx-[0.04em] font-normal text-primary">/</span>9
    </span>
  );
}
