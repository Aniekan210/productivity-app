import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Target,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { navItems, isNavActive } from "@/components/Layout";
import Wordmark from "@/components/Wordmark";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

const ICONS = { LayoutDashboard, CalendarCheck, Target, History, Settings };

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout(false);
    navigate("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-6 pb-6 pt-8">
        <Link to="/" className="inline-block text-[1.75rem] leading-none">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Main">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isNavActive(item.to, location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px]", active && "text-primary")}
                strokeWidth={active ? 2.25 : 1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserAvatar user={user} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.name || "Your account"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="icon-btn"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
