import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  History,
  Settings,
} from "lucide-react";
import { navItems } from "@/components/Layout";
import { cn } from "@/lib/utils";

const ICONS = { LayoutDashboard, CalendarCheck, Target, History, Settings };

export default function MobileNav() {
  const location = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-border bg-background/90 backdrop-blur-lg md:hidden">
      {navItems.map((item) => {
        const Icon = ICONS[item.icon];
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "absolute top-0 h-0.5 rounded-full bg-primary transition-all",
                active ? "w-8" : "w-0",
              )}
            />
            <Icon className="h-5 w-5" />
            <span className="truncate">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
