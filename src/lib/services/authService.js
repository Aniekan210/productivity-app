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
  loginWithGoogle: (returnTo) => api.auth.loginWithGoogle(returnTo),
};

export default authService;
