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
  getAccent,
} from "@/lib/theme";
import { calendarQuarterFor } from "@/lib/quarterUtils";
import { api } from "@/api/apiClient";
import { qk } from "@/lib/useData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppearanceControls from "@/components/AppearanceControls";
import AppearancePreview from "@/components/AppearancePreview";
import { cn } from "@/lib/utils";
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
      await api.auth.updateMe({
        ...appearance,
        timezone,
        onboarded: true,
      });
      const q = calendarQuarterFor(new Date());
      const quarter = await api.entities.Quarter.create({
        name: q.name,
        start_date: format(q.start, "yyyy-MM-dd"),
        end_date: format(q.end, "yyyy-MM-dd"),
        status: "active",
        theme: appearance.theme,
        accent_color: appearance.primary,
      });
      const goalTitles = goals.map((g) => g.trim()).filter(Boolean);
      if (goalTitles.length) {
        await api.entities.Goal.bulkCreate(
          goalTitles.map((t) => ({
            quarter_id: quarter.id,
            title: t,
            status: "active",
          })),
        );
      }
      const actTitles = activities.map((a) => a.trim()).filter(Boolean);
      const today = format(new Date(), "yyyy-MM-dd");
      if (actTitles.length) {
        await api.entities.Activity.bulkCreate(
          actTitles.map((t) => ({
            quarter_id: quarter.id,
            date: today,
            title: t,
            completed: false,
          })),
        );
      }
      qc.invalidateQueries({ queryKey: qk.quarters });
      qc.invalidateQueries({ queryKey: qk.goals(quarter.id) });
      qc.invalidateQueries({ queryKey: qk.activities(quarter.id) });
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
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="font-display text-2xl font-semibold tracking-tight">
            3/6/9
          </p>
          <p className="text-xs text-muted-foreground">Onboarding</p>
        </div>

        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-muted",
                )}
              />
            </div>
          ))}
        </div>
        <p className="mb-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>

        {step === 0 && (
          <div className="space-y-5">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              90 days. A few goals. A few things every day.
            </h1>
            <p className="text-muted-foreground">
              Make the quarter count. 3/6/9 helps you plan a focused 90-day
              quarter, show up daily, and look back on a beautiful record of
              what you accomplished.
            </p>
            <div className="surface-card p-5 text-sm">
              <p className="font-medium">The framework</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>
                  <b className="text-foreground">3</b> — daily activities (a
                  recommendation, not a limit)
                </li>
                <li>
                  <b className="text-foreground">6</b> — quarterly goals (a
                  recommendation, not a limit)
                </li>
                <li>
                  <b className="text-foreground">9</b> — the 90-day quarter
                  timeline
                </li>
              </ul>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Make it yours</h2>
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
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preview
                </p>
                <AppearancePreview value={appearance} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">
                Set your quarterly goals
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
                    className="rounded p-2 text-muted-foreground hover:text-foreground"
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
              <h2 className="text-xl font-semibold">What's on for today?</h2>
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
                    className="rounded p-2 text-muted-foreground hover:text-foreground"
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
            <h2 className="text-xl font-semibold">You're all set</h2>
            <p className="text-muted-foreground">
              Your first quarter is ready. Open the dashboard each day, check
              off your activities, and watch your 90-day timeline come to life.
            </p>
            <AppearancePreview value={appearance} />
            <div className="surface-card p-5 text-sm">
              <p>
                <b>Theme:</b>{" "}
                <span className="capitalize">{appearance.theme}</span> ·{" "}
                <b>Color:</b> {getAccent(appearance.primary).name}
              </p>
              <p>
                <b>Font:</b> {appearance.font} · <b>Corners:</b>{" "}
                {appearance.radius}
              </p>
              <p>
                <b>Goals:</b> {goals.filter((g) => g.trim()).length}
              </p>
              <p>
                <b>Today's activities:</b>{" "}
                {activities.filter((a) => a.trim()).length}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
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
