"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { User, Lock, Mail, CheckCircle } from "lucide-react";

const LoginScreen: React.FC = () => {
  const { login, register, loginWithGoogle, sendEmailVerification, user, isEmailVerified } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        await register(email, password);
        setVerificationSent(true);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already in use. Try signing in instead.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address format.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        default:
          setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign in was cancelled.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification();
      setVerificationSent(true);
    } catch (err: any) {
      setError("Failed to send verification email. Please try again.");
    }
  };

  // Show verification pending screen
  if (user && !isEmailVerified) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md z-10 space-y-8">
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-2xl shadow-orange-500/30 mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Verify Your Email</h1>
            <p className="text-muted-foreground font-medium text-center max-w-sm">
              We've sent a verification link to <span className="text-primary font-semibold">{user.email}</span>. Please check your inbox.
            </p>
          </div>

          <div className="rounded-3xl p-8 shadow-xl bg-card border border-border space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Mail className="w-5 h-5 text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Click the link in your email to verify your account and unlock all features.</p>
            </div>

            {verificationSent && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Verification email sent!</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full h-12 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl border border-border"
              >
                Resend Verification Email
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                I've Verified My Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="flex flex-col items-center">
          <img
            src="/logo.jpg"
            alt="RT Logo"
            className="h-20 w-20 rounded-2xl shadow-2xl shadow-purple-500/30 mb-6 transition-transform hover:scale-105 duration-500"
          />
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Routine Tracker</h1>
          <p className="text-muted-foreground font-medium">Your daily companion</p>
        </div>

        <div className="rounded-3xl p-8 shadow-xl bg-card border border-border">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">
              {isRegistering ? "Create Account" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isRegistering
                ? "Join us to start tracking your daily routines."
                : "Enter your credentials to access your routines"}
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold rounded-xl mb-6 flex items-center justify-center gap-3 transition-all border border-border"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                className="bg-muted border-border text-foreground"
              />
              <Input
                label="Password"
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                className="bg-muted border-border text-foreground"
              />
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 transition-all font-semibold rounded-xl text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? "Please wait..." : isRegistering ? "Sign Up" : "Sign In"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isRegistering ? "Already have an account? " : "New user? "}
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {isRegistering ? "Sign In" : "Create Account"}
                </button>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground/60 pt-4">
          Your routines, synced everywhere
        </p>
      </div>
    </div>
  );
};

export { LoginScreen };

