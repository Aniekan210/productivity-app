import React, { useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { applyAppearance, readAppearance } from "@/lib/theme";
import { useEnsureActiveQuarter } from "@/lib/useData";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export const navItems = [
  { to: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { to: "/activities", label: "Activities", icon: "CalendarCheck" },
  { to: "/goals", label: "Goals", icon: "Target" },
  { to: "/past-quarters", label: "Past Quarters", icon: "History" },
  { to: "/settings", label: "Settings", icon: "Settings" },
];

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
      <main className="md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
