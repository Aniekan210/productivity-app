import { api } from "@/api/apiClient";

export const authService = {
  me: () => api.auth.me(),
  isAuthenticated: () =>
    api.auth
      .me()
      .then(() => true)
      .catch(() => false),
  updateMe: (data) => api.auth.updateMe(data),
  logout: () => api.auth.logout(),
  redirectToLogin: (nextUrl) => {
    window.location.href = `/login?returnTo=${encodeURIComponent(nextUrl)}`;
  },

  loginViaEmailPassword: (email, password) =>
    api.auth.loginViaEmailPassword(email, password),
  loginWithProvider: (provider, fromUrl) =>
    api.auth.loginWithProvider(provider, fromUrl),
  register: (data) => api.auth.register(data.email, data.password),
  verifyOtp: (data) => api.auth.verifyOtp(data),
  resendOtp: (email) => api.auth.resendOtp(email),
  resetPasswordRequest: (email) => api.auth.resetPasswordRequest(email),
  resetPassword: (data) => api.auth.resetPassword(data),
};

export default authService;
