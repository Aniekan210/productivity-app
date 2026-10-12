import React, { useState } from "react";
import { cn } from "@/lib/utils";

// Google profile photo when available, otherwise the first initial.
export default function UserAvatar({ user, className }) {
  const [broken, setBroken] = useState(false);
  const label = user?.name || user?.email || "?";
  if (user?.image && !broken) {
    return (
      <img
        src={user.image}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={cn("h-8 w-8 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary",
        className,
      )}
    >
      {label.slice(0, 1)}
    </span>
  );
}
