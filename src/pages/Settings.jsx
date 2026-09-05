import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, AlertTriangle, LocateFixed } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useUpdateSettings } from "@/lib/useData";
import { applyAppearance, readAppearance, detectTimezone } from "@/lib/theme";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
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
  const { user, logout, refreshUser, checkUserAuth } = useAuth();
  const navigate = useNavigate();
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

  const handleAppearance = (patch) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
    updateSettings.mutate(next);
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

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  const clearData = async () => {
    try {
      await Promise.all([
        api.entities.Activity.deleteMany({}),
        api.entities.Goal.deleteMany({}),
        api.entities.Quarter.deleteMany({}),
      ]);
      await api.auth.updateMe({ onboarded: false });
      await checkUserAuth();
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
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Theme, color, background, font, and corners. Changes apply
            instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <AppearanceControls
              value={appearance}
              onChange={handleAppearance}
            />
            <div className="lg:sticky lg:top-6 lg:self-start">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <AppearancePreview value={appearance} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timezone</CardTitle>
          <CardDescription>
            Used to determine "today" for your activities and timeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={timezone} onValueChange={handleTimezone}>
            <SelectTrigger className="w-full">
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
          <Button variant="outline" size="sm" onClick={detectTz}>
            <LocateFixed className="mr-2 h-4 w-4" /> Use my device timezone
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={user?.full_name || ""}
              readOnly
              disabled
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={user?.email || ""}
              readOnly
              disabled
              className="bg-muted/50"
            />
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Data</CardTitle>
          <CardDescription>
            Permanently delete all your quarters, goals, and activities. This
            cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Clear all data
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
                className="my-2"
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
        </CardContent>
      </Card>
    </div>
  );
}
