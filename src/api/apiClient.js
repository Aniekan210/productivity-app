import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
  plugins: [emailOTPClient()],
});

async function apiRequest(path, options = {}) {
  const res = await fetch(`/api/entities/${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.status === 204 ? null : res.json();
}

function makeEntity(tableName) {
  return {
    list: (query = "") => apiRequest(`${tableName}${query ? `?${query}` : ""}`),

    // query: plain object of field -> value, e.g. { quarter_id: "abc" }.
    // sort: optional field name, prefix with "-" for descending
    // (matches the existing list() sort convention).
    filter: (query = {}, sort, limit) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query || {})) {
        if (v !== undefined && v !== null) params.set(k, v);
      }
      if (sort) params.set(sort, "");
      if (limit) params.set("limit", limit);
      const qs = params.toString();
      return apiRequest(`${tableName}${qs ? `?${qs}` : ""}`);
    },

    get: (id) => apiRequest(`${tableName}/${id}`),

    create: (data) =>
      apiRequest(tableName, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    bulkCreate: (records) =>
      apiRequest(`${tableName}/bulk`, {
        method: "POST",
        body: JSON.stringify({
          records,
        }),
      }),

    update: (id, data) =>
      apiRequest(`${tableName}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id) =>
      apiRequest(`${tableName}/${id}`, {
        method: "DELETE",
      }),

    deleteMany: (filter = {}) =>
      apiRequest(`${tableName}/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({
          filter,
        }),
      }),
  };
}

export const api = {
  auth: {
    resetPasswordRequest: (email) =>
      authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      }),

    loginViaEmailPassword: (email, password) =>
      authClient.signIn.email({
        email,
        password,
      }),

    loginWithProvider: (provider, callbackURL) =>
      authClient.signIn.social({
        provider,
        callbackURL,
      }),

    register: async (email, password) => {
      await authClient.signUp.email({
        email,
        password,
      });

      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
    },

    verifyOtp: ({ email, otpCode }) =>
      authClient.emailOtp.verifyEmail({
        email,
        otp: otpCode,
      }),

    resendOtp: (email) =>
      authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      }),

    updateMe: (data) =>
      authClient.updateUser({
        theme: data.theme,
        primary: data.primary,
        font: data.font,
        radius: data.radius,
        timezone: data.timezone,
        onboarded: data.onboarded,
      }),

    logout: () => authClient.signOut(),

    me: async () => {
      const { data } = await authClient.getSession();

      if (!data) {
        throw new Error("Not authenticated");
      }

      return data.user;
    },

    resetPassword: ({ resetToken, newPassword }) =>
      authClient.resetPassword({
        newPassword,
        token: resetToken,
      }),
  },

  entities: new Proxy(
    {},
    {
      get: (_target, entityName) => makeEntity(entityName.toLowerCase()),
    },
  ),
};
