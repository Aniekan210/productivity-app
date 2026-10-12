import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  History,
  Settings,
} from "lucide-react";
import { navItems, isNavActive } from "@/components/Layout";
import { cn } from "@/lib/utils";

const ICONS = { LayoutDashboard, CalendarCheck, Target, History, Settings };

export default function MobileNav() {
  const location = useLocation();
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isNavActive(item.to, location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] transition-colors",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-md transition-colors",
                  active && "bg-primary/12",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "text-primary")}
                  strokeWidth={active ? 2.25 : 1.75}
                />
              </span>
              <span className="truncate">{item.short || item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
