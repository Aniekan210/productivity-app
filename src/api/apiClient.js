import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});

async function apiRequest(path, options = {}) {
  const res = await fetch(`/api/entities/${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) throw new Error(await res.text());

  return res.status === 204 ? null : res.json();
}

function makeEntity(tableName) {
  return {
    list: (query = "") => apiRequest(`${tableName}${query ? `?${query}` : ""}`),

    get: (id) => apiRequest(`${tableName}/${id}`),

    create: (data) =>
      apiRequest(tableName, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    bulkCreate: (records) =>
      apiRequest(`${tableName}/bulk`, {
        method: "POST",
        body: JSON.stringify({ records }),
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
        body: JSON.stringify({ filter }),
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

    updateMe: (data) => authClient.updateUser(data),

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
