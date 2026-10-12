import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "@/lib/services/authService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, Loader2 } from "lucide-react";
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
      icon={LogIn}
      title="Welcome"
      subtitle="Sign in with your Google account to continue"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium"
        onClick={handleGoogle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5 mr-2" />
        )}
        Continue with Google
      </Button>
    </AuthLayout>
  );
}
