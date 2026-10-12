import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      {Icon && (
        <Icon
          className="mb-4 h-6 w-6 text-muted-foreground/70"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
      <p className="font-display text-xl font-medium tracking-tight">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
