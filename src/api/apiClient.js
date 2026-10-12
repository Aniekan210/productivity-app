import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
});

async function request(url, { headers, ...options } = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}

function makeEntity(name) {
  const base = `/api/entities/${name}`;
  return {
    // query: { field: value } equality filters.
    // sort: field name, "-" prefix for descending (e.g. "-start_date").
    filter: (query = {}, sort, limit) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query || {})) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      if (sort) params.set("sort", sort);
      if (limit) params.set("limit", String(limit));
      const qs = params.toString();
      return request(qs ? `${base}?${qs}` : base);
    },

    list: (sort, limit) => makeEntity(name).filter({}, sort, limit),

    get: (id) => request(`${base}/${encodeURIComponent(id)}`),

    create: (data) =>
      request(base, { method: "POST", body: JSON.stringify(data) }),

    bulkCreate: (records) =>
      request(`${base}/bulk`, {
        method: "POST",
        body: JSON.stringify({ records }),
      }),

    update: (id, data) =>
      request(`${base}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id) =>
      request(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" }),
  };
}

export const api = {
  auth: {
    // Google is the only sign-in method. On failure better-auth sends the
    // user back to errorCallbackURL with ?error=<code>.
    loginWithGoogle: (callbackURL) =>
      authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL: "/login",
      }),

    updateMe: async (data) => {
      const { error } = await authClient.updateUser({
        theme: data.theme,
        primary: data.primary,
        background: data.background,
        textOnPrimary: data.textOnPrimary,
        font: data.font,
        radius: data.radius,
        timezone: data.timezone,
        onboarded: data.onboarded,
      });
      if (error) throw new Error(error.message || "Could not save settings");
    },

    logout: () => authClient.signOut(),

    me: async () => {
      const { data } = await authClient.getSession();

      if (!data) {
        throw new Error("Not authenticated");
      }

      return data.user;
    },
  },

  account: {
    onboard: (payload) =>
      request("/api/account/onboard", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    clearData: () => request("/api/account/data", { method: "DELETE" }),
  },

  entities: {
    Quarter: makeEntity("quarter"),
    Goal: makeEntity("goal"),
    Activity: makeEntity("activity"),
  },
};
