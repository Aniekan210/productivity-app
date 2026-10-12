import React, { createContext, useState, useContext, useEffect } from "react";

import { authService } from "@/lib/services/authService";
import { queryClientInstance } from "@/lib/query-client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);

      const currentUser = await authService.me();

      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await authService.logout();
    } catch (e) {
      // Still clear local state; the session cookie expires on its own.
    }
    // Drop cached data so the next account on this browser never sees it.
    queryClientInstance.clear();

    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      window.location.href = "/login";
    }
  };

  const navigateToLogin = () => {
    authService.redirectToLogin(window.location.href);
  };

  const updateUser = (data) => {
    setUser((u) => (u ? { ...u, ...data } : u));
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
    } catch (e) {
      // Ignore. The optimistic update already reflects the change.
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
