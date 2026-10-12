import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/lib/services/authService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

// better-auth redirects back here with ?error=<code> when Google sign-in
// fails or is cancelled.
function errorFromUrl() {
  const code = new URLSearchParams(window.location.search).get("error");
  if (!code) return "";
  if (code === "access_denied") return "Google sign-in was cancelled.";
  return "Google sign-in failed. Please try again.";
}

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState(errorFromUrl);
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  if (isAuthenticated) return <Navigate to={returnTo} replace />;

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await authService.loginWithGoogle(returnTo);
      // On success the browser navigates to Google; only errors return here.
      if (result?.error) throw new Error(result.error.message);
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="90 days. A few goals. A few things every day."
      subtitle="Plan a focused quarter, show up daily, and keep a record of what you did."
      footer="Signing in creates your account if you don't have one yet."
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        variant="outline"
        size="lg"
        className="h-12 w-full text-[0.95rem]"
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        Continue with Google
      </Button>
    </AuthLayout>
  );
}
