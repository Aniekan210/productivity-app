import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { todayKey, calendarQuarterFor } from "./quarterUtils";
import { useAuth } from "@/lib/AuthContext";
import { readAppearance } from "@/lib/theme";
import { dataService } from "@/lib/services/dataService";
import { authService } from "@/lib/services/authService";

const Quarter = dataService.collection("Quarter");
const Goal = dataService.collection("Goal");
const Activity = dataService.collection("Activity");

export const qk = {
  quarters: ["quarters"],
  goals: (qid) => ["goals", qid],
  activities: (qid) => ["activities", qid],
};

export function useQuarters() {
  return useQuery({
    queryKey: qk.quarters,
    queryFn: async () => Quarter.list("-created_date"),
  });
}

export function useActiveQuarter() {
  const q = useQuarters();
  const list = q.data || [];
  const active = list.find((x) => x.status === "active") || null;
  return { ...q, active };
}

export function useQuarter(id) {
  return useQuery({
    queryKey: ["quarter", id],
    queryFn: async () => Quarter.get(id),
    enabled: !!id,
  });
}

export function useGoals(qid) {
  return useQuery({
    queryKey: qk.goals(qid),
    queryFn: async () => Goal.filter({ quarter_id: qid }),
    enabled: !!qid,
  });
}

export function useActivities(qid) {
  return useQuery({
    queryKey: qk.activities(qid),
    queryFn: async () => Activity.filter({ quarter_id: qid }),
    enabled: !!qid,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return (keys) => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
}

// Quarters are auto-managed by the app (no manual creation). On load, make
// sure an active quarter exists for the current calendar quarter; if the
// stored active quarter belongs to a past calendar quarter, roll it to
// completed and start a fresh empty one. Runs once per app load.
export function useEnsureActiveQuarter() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    // Only manage quarters for onboarded users — onboarding creates the first
    // one, and non-onboarded users are redirected there before this should run.
    if (!user?.onboarded) return;
    ran.current = true;
    (async () => {
      try {
        const quarters = await Quarter.list("-created_date");
        const actives = quarters.filter((q) => q.status === "active");
        const now = new Date();
        const cal = calendarQuarterFor(now);
        const matching = actives.find((q) => q.name === cal.name);
        if (matching) {
          const stray = actives.filter((q) => q.id !== matching.id);
          if (stray.length) {
            await Promise.all(
              stray.map((q) => Quarter.update(q.id, { status: "completed" })),
            );
          }
        } else {
          await Promise.all(
            actives.map((q) => Quarter.update(q.id, { status: "completed" })),
          );
          const appearance = readAppearance(user);
          await Quarter.create({
            name: cal.name,
            start_date: format(cal.start, "yyyy-MM-dd"),
            end_date: format(cal.end, "yyyy-MM-dd"),
            status: "active",
            theme: appearance.theme,
            accent_color: appearance.primary,
          });
        }
        qc.invalidateQueries({ queryKey: qk.quarters });
      } catch (e) {
        /* ignore — the list query will still render whatever exists */
      }
    })();
  }, [user, qc]);
}

export function useSaveQuarter() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, data }) =>
      id ? Quarter.update(id, data) : Quarter.create(data),
    onSuccess: () => inv([qk.quarters]),
  });
}

export function useDeleteQuarter() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id) => Quarter.delete(id),
    onSuccess: () => inv([qk.quarters]),
  });
}

export function useSaveGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, quarter_id }) =>
      id ? Goal.update(id, data) : Goal.create({ ...data, quarter_id }),
    onMutate: async ({ id, data, quarter_id }) => {
      const key = qk.goals(quarter_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      if (id) {
        qc.setQueryData(key, (old) =>
          (old || []).map((g) => (g.id === id ? { ...g, ...data } : g)),
        );
      } else {
        const temp = {
          ...data,
          id: `temp_${Date.now()}`,
          created_date: new Date().toISOString(),
        };
        qc.setQueryData(key, (old) => [...(old || []), temp]);
      }
      return { prev, key };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, vars, ctx) => {
      if (ctx) qc.invalidateQueries({ queryKey: ctx.key });
      if (vars?.quarter_id)
        qc.invalidateQueries({ queryKey: qk.goals(vars.quarter_id) });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quarter_id }) => Goal.delete(id),
    onMutate: async ({ id, quarter_id }) => {
      const key = qk.goals(quarter_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => (old || []).filter((g) => g.id !== id));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, vars, ctx) => {
      if (ctx) qc.invalidateQueries({ queryKey: ctx.key });
      if (vars?.quarter_id)
        qc.invalidateQueries({ queryKey: qk.goals(vars.quarter_id) });
    },
  });
}

export function useSaveActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, quarter_id }) =>
      id ? Activity.update(id, data) : Activity.create({ ...data, quarter_id }),
    onMutate: async ({ id, data, quarter_id }) => {
      const key = qk.activities(quarter_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      if (id) {
        qc.setQueryData(key, (old) =>
          (old || []).map((a) => (a.id === id ? { ...a, ...data } : a)),
        );
      } else {
        const temp = {
          ...data,
          id: `temp_${Date.now()}`,
          created_date: new Date().toISOString(),
        };
        qc.setQueryData(key, (old) => [...(old || []), temp]);
      }
      return { prev, key };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, vars, ctx) => {
      if (ctx) qc.invalidateQueries({ queryKey: ctx.key });
      if (vars?.quarter_id)
        qc.invalidateQueries({ queryKey: qk.activities(vars.quarter_id) });
    },
  });
}

export function useToggleActivity(quarter_id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }) =>
      Activity.update(id, {
        completed,
        completed_date: completed ? new Date().toISOString() : null,
      }),
    onMutate: async ({ id, completed }) => {
      const key = qk.activities(quarter_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) =>
        (old || []).map((a) =>
          a.id === id
            ? {
                ...a,
                completed,
                completed_date: completed ? new Date().toISOString() : null,
              }
            : a,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) =>
      ctx && qc.setQueryData(qk.activities(quarter_id), ctx.prev),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: qk.activities(quarter_id) }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quarter_id }) => Activity.delete(id),
    onMutate: async ({ id, quarter_id }) => {
      const key = qk.activities(quarter_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => (old || []).filter((a) => a.id !== id));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, vars, ctx) => {
      if (ctx) qc.invalidateQueries({ queryKey: ctx.key });
      if (vars?.quarter_id)
        qc.invalidateQueries({ queryKey: qk.activities(vars.quarter_id) });
    },
  });
}

export function useBulkCreateActivities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ records, quarter_id }) => Activity.bulkCreate(records),
    onMutate: async ({ records, quarter_id }) => {
      const key = qk.activities(quarter_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      const temp = records.map((r, i) => ({
        ...r,
        id: `temp_${Date.now()}_${i}`,
        created_date: new Date().toISOString(),
      }));
      qc.setQueryData(key, (old) => [...(old || []), ...temp]);
      return { prev, key };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.prev),
    onSettled: (_d, vars, ctx) => {
      if (ctx) qc.invalidateQueries({ queryKey: ctx.key });
      if (vars?.quarter_id)
        qc.invalidateQueries({ queryKey: qk.activities(vars.quarter_id) });
    },
  });
}

// User settings are stored as top-level custom fields on the user record. We
// re-send every known appearance field plus the incoming changes so nothing is
// lost (e.g. `onboarded`) whether the backend merges or replaces. `refreshUser`
// re-syncs without a loading flash.
export function useUpdateSettings(refreshUser) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data) =>
      authService.updateMe({
        theme: user?.theme,
        primary: user?.primary,
        background: user?.background,
        textOnPrimary: user?.textOnPrimary,
        radius: user?.radius,
        font: user?.font,
        timezone: user?.timezone,
        onboarded: user?.onboarded,
        ...data,
      }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["user"] });
      if (refreshUser) await refreshUser();
    },
  });
}

export { todayKey };
