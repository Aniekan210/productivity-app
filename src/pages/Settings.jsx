import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, AlertTriangle, LocateFixed } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUpdateSettings } from "@/lib/useData";
import { applyAppearance, readAppearance, detectTimezone } from "@/lib/theme";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import UserAvatar from "@/components/UserAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppearanceControls from "@/components/AppearanceControls";
import AppearancePreview from "@/components/AppearancePreview";
import { useToast } from "@/components/ui/use-toast";

const TIMEZONES = [
  "UTC",
  "America/Halifax",
  "America/St_Johns",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Atlantic/Reykjavik",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Athens",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const updateSettings = useUpdateSettings(refreshUser);
  const { toast } = useToast();

  const timezone = user?.timezone || detectTimezone() || "UTC";
  const [confirmText, setConfirmText] = useState("");
  const [appearance, setAppearance] = useState(() => readAppearance(user));

  useEffect(() => {
    setAppearance(readAppearance(user));
  }, [
    user?.theme,
    user?.primary,
    user?.background,
    user?.textOnPrimary,
    user?.radius,
    user?.font,
  ]);

  // Color pickers fire on every drag step, so batch saves: apply instantly,
  // persist once the user pauses. A pending save is flushed on unmount.
  const pendingSave = useRef(null);
  const saveTimer = useRef(null);
  const flushSave = () => {
    clearTimeout(saveTimer.current);
    if (pendingSave.current) {
      updateSettings.mutate(pendingSave.current);
      pendingSave.current = null;
    }
  };
  const flushRef = useRef(flushSave);
  flushRef.current = flushSave;
  useEffect(() => () => flushRef.current(), []);

  const handleAppearance = (patch) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
    pendingSave.current = next;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 400);
  };

  const handleTimezone = (tz) => {
    updateSettings.mutate({ timezone: tz });
    toast({ title: "Timezone updated", description: tz });
  };

  const detectTz = () => {
    const tz = detectTimezone();
    if (tz) {
      updateSettings.mutate({ timezone: tz });
      toast({ title: "Timezone set to your device", description: tz });
    }
  };

  const handleLogout = async () => {
    flushSave();
    await logout(false);
    navigate("/login");
  };

  const clearData = async () => {
    try {
      await api.account.clearData();
      qc.removeQueries();
      await refreshUser();
      toast({ title: "All data cleared" });
      navigate("/onboarding", { replace: true });
    } catch (e) {
      toast({
        title: "Could not clear data",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Settings" />

      <div className="divide-y divide-border border-y border-border">
        <SettingsSection
          title="Appearance"
          description="Theme, color, font and corners. Changes apply as you go."
        >
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <AppearanceControls
              value={appearance}
              onChange={handleAppearance}
            />
            <div className="xl:sticky xl:top-8 xl:self-start">
              <p className="mb-2 text-sm text-muted-foreground">Preview</p>
              <AppearancePreview value={appearance} />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Timezone"
          description={'Decides when "today" starts for your activities and timeline.'}
        >
          <div className="flex max-w-md flex-col gap-3">
            <Select value={timezone} onValueChange={handleTimezone}>
              <SelectTrigger className="h-10 w-full bg-card">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="self-start" onClick={detectTz}>
              <LocateFixed className="h-4 w-4" /> Use this device's timezone
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection title="Account" description="Signed in with Google.">
          <div className="flex max-w-md flex-wrap items-center gap-4">
            <UserAvatar user={user} className="h-11 w-11 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{user?.name || "Your account"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Danger zone"
          description="Permanently delete every quarter, goal and activity. Your account stays."
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Clear all data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Clear
                  all data?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes every quarter, goal, and activity
                  you've created. To confirm, type <b>DELETE</b> below.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm"
                autoCapitalize="characters"
                autoComplete="off"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearData}
                  disabled={confirmText !== "DELETE"}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, description, children }) {
  return (
    <section className="grid gap-4 py-7 sm:py-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="section-title">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
