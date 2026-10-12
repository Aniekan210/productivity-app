import React, { useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { applyAppearance, readAppearance } from "@/lib/theme";
import { useEnsureActiveQuarter } from "@/lib/useData";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Wordmark from "@/components/Wordmark";
import UserAvatar from "@/components/UserAvatar";

export const navItems = [
  { to: "/", label: "Dashboard", short: "Home", icon: "LayoutDashboard" },
  { to: "/activities", label: "Activities", icon: "CalendarCheck" },
  { to: "/goals", label: "Goals", icon: "Target" },
  { to: "/past-quarters", label: "Past quarters", short: "Past", icon: "History" },
  { to: "/settings", label: "Settings", icon: "Settings" },
];

// A past quarter's detail page still lights up "Past quarters".
export function isNavActive(to, pathname) {
  if (to === "/") return pathname === "/";
  if (to === "/past-quarters") return pathname === to || pathname.startsWith("/quarter/");
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Quarters are auto-created by the app — no manual creation.
  useEnsureActiveQuarter();

  const appearance = useMemo(
    () => readAppearance(user),
    [
      user?.theme,
      user?.primary,
      user?.accent,
      user?.accent2,
      user?.background,
      user?.textOnPrimary,
      user?.radius,
      user?.font,
    ],
  );

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

  // React to OS color-scheme changes when in "system" mode.
  useEffect(() => {
    if (appearance.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyAppearance(appearance);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [appearance]);

  // Redirect to onboarding if not onboarded (but not while already there).
  useEffect(() => {
    const onboarded = user?.onboarded === true;
    if (user && !onboarded && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      {/* Slim top bar on phones, where the sidebar is hidden. */}
      <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] md:hidden">
        <Link to="/" className="text-[1.35rem] leading-none">
          <Wordmark />
        </Link>
        <Link to="/settings" aria-label="Settings">
          <UserAvatar user={user} className="h-7 w-7" />
        </Link>
      </div>
      <main className="md:pl-60">
        <div className="mx-auto w-full max-w-5xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:px-10 md:pb-16 md:pt-10">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
