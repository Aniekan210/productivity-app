import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  applyAppearance,
  readAppearance,
  detectTimezone,
} from "@/lib/theme";
import { calendarQuarterFor } from "@/lib/quarterUtils";
import { api } from "@/api/apiClient";
import { qk } from "@/lib/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppearanceControls from "@/components/AppearanceControls";
import AppearancePreview from "@/components/AppearancePreview";
import { cn } from "@/lib/utils";
import Wordmark from "@/components/Wordmark";
import { useToast } from "@/components/ui/use-toast";

const STEPS = ["Welcome", "Appearance", "Goals", "Today", "Finish"];

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [appearance, setAppearance] = useState(readAppearance(user));
  const [goals, setGoals] = useState([""]);
  const [activities, setActivities] = useState([""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

  const handleAppearance = (patch) =>
    setAppearance((prev) => ({ ...prev, ...patch }));

  const finish = async () => {
    setSaving(true);
    try {
      const timezone = detectTimezone();
      const q = calendarQuarterFor(new Date());
      const today = format(new Date(), "yyyy-MM-dd");
      // One request, one transaction: settings, the first quarter and the
      // starter goals/activities are saved together or not at all.
      await api.account.onboard({
        appearance,
        timezone,
        quarter: {
          name: q.name,
          start_date: format(q.start, "yyyy-MM-dd"),
          end_date: format(q.end, "yyyy-MM-dd"),
        },
        goals: goals.map((g) => g.trim()).filter(Boolean),
        activities: activities
          .map((a) => a.trim())
          .filter(Boolean)
          .map((title) => ({ title, date: today })),
      });
      qc.invalidateQueries({ queryKey: qk.quarters });
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
      updateUser({ ...appearance, timezone, onboarded: true });
      navigate("/", { replace: true });
    } catch (e) {
      toast({
        title: "Something went wrong",
        description: e.message,
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] text-foreground">
      <div className="mx-auto max-w-2xl">
        <Wordmark className="text-3xl" />

        <div className="mb-3 mt-8 flex items-center gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-primary" : "bg-muted",
                )}
              />
            </div>
          ))}
        </div>
        <p className="mb-8 text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>

        {step === 0 && (
          <div className="space-y-5">
            <h1 className="font-display text-[2.25rem] font-medium leading-[1.1] tracking-tight sm:text-5xl">
              90 days. A few goals. A few things every day.
            </h1>
            <p className="max-w-lg text-muted-foreground">
              Make the quarter count. Plan a focused 90 days, show up daily,
              and look back on a record of what you actually did.
            </p>
            <dl className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border bg-card">
              {[
                ["3", "things a day"],
                ["6", "goals a quarter"],
                ["90", "days to do it"],
              ].map(([n, label]) => (
                <div key={n} className="p-4 sm:p-5">
                  <dt className="text-4xl font-semibold leading-none tracking-tight text-primary sm:text-5xl">
                    {n}
                  </dt>
                  <dd className="mt-2 text-sm text-muted-foreground">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              The numbers are a guide, not a limit.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-[1.75rem] font-medium tracking-tight">Make it yours</h2>
              <p className="text-sm text-muted-foreground">
                Theme, one color, font, and corners. The preview shows exactly
                how it'll look.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-[1fr_260px]">
              <AppearanceControls
                value={appearance}
                onChange={handleAppearance}
              />
              <div className="md:sticky md:top-6 md:self-start">
                <p className="mb-2 text-sm text-muted-foreground">Preview</p>
                <AppearancePreview value={appearance} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-[1.75rem] font-medium tracking-tight">
                What's this quarter for?
              </h2>
              <p className="text-sm text-muted-foreground">
                6 is the recommended number — but you can set as few or as many
                as you like.
              </p>
            </div>
            <div className="space-y-2">
              {goals.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={g}
                    onChange={(e) =>
                      setGoals(
                        goals.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                    placeholder={`Goal ${i + 1}`}
                  />
                  <button
                    onClick={() => setGoals(goals.filter((_, j) => j !== i))}
                    className="icon-btn h-10 w-10 shrink-0"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGoals([...goals, ""])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add goal
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-[1.75rem] font-medium tracking-tight">What's on for today?</h2>
              <p className="text-sm text-muted-foreground">
                3 activities are recommended. These are just for today — you can
                plan each day as it comes.
              </p>
            </div>
            <div className="space-y-2">
              {activities.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={a}
                    onChange={(e) =>
                      setActivities(
                        activities.map((x, j) =>
                          j === i ? e.target.value : x,
                        ),
                      )
                    }
                    placeholder={`Activity ${i + 1}`}
                  />
                  <button
                    onClick={() =>
                      setActivities(activities.filter((_, j) => j !== i))
                    }
                    className="icon-btn h-10 w-10 shrink-0"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivities([...activities, ""])}
            >
              <Plus className="mr-1 h-4 w-4" /> Add activity
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-[1.75rem] font-medium tracking-tight">You're all set</h2>
            <p className="text-muted-foreground">
              Your first quarter is ready. Open the dashboard each day, check
              off your activities, and watch your 90-day timeline come to life.
            </p>
            <AppearancePreview value={appearance} />
            <dl className="grid grid-cols-2 divide-x divide-border overflow-hidden rounded-lg border border-border bg-card">
              <div className="p-4">
                <dt className="text-sm text-muted-foreground">Goals</dt>
                <dd className="text-3xl font-semibold tracking-tight text-primary">
                  {goals.filter((g) => g.trim()).length}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-sm text-muted-foreground">
                  Planned today
                </dt>
                <dd className="text-3xl font-semibold tracking-tight text-primary">
                  {activities.filter((a) => a.trim()).length}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="pb-safe sticky bottom-0 mt-10 flex items-center justify-between gap-3 border-t border-border bg-background/90 py-4 backdrop-blur-lg">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? "Setting up…" : "Go to dashboard"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
