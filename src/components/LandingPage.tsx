"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { User, Lock, Mail, CheckCircle, Timer, Sparkles, Trophy, ArrowRight, Check } from "lucide-react";

// --- Components for Landing Page Sections ---

const FeatureCard = ({ icon: Icon, title, description }: any) => (
    <div className="brutal-card group">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center brutal-border bg-primary transition-transform group-hover:scale-110">
            <Icon className="h-7 w-7 text-primary-foreground" />
        </div>
        <h3 className="mb-3 text-xl font-black uppercase text-foreground tracking-tighter">{title}</h3>
        <p className="text-muted-foreground font-bold leading-tight">
            {description}
        </p>
    </div>
);

const StepCard = ({ number, title, description }: any) => (
    <div className="brutal-card flex flex-col items-center text-center p-8 bg-background shadow-none hover:shadow-primary/20">
        <div className="mb-6 flex h-16 w-16 items-center justify-center brutal-border bg-primary text-2xl font-black text-primary-foreground brutal-shadow">
            {number}
        </div>
        <h3 className="mb-3 text-xl font-black uppercase tracking-tight text-foreground">{title}</h3>
        <p className="text-muted-foreground font-bold leading-tight max-w-xs">
            {description}
        </p>
    </div>
);

// --- Main Landing Page Component ---

const LandingPage: React.FC = () => {
    const { login, register, loginWithGoogle, user } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // --- Auth Handlers (copied from LoginScreen) ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!username || !password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        try {
            if (isRegistering) {
                await register(username, password);
                // No verification needed for username auth
            } else {
                await login(username, password);
            }
        } catch (err: any) {
            console.error(err);
            switch (err.code) {
                case "auth/email-already-in-use":
                    setError("This username is already taken. Try another.");
                    break;
                case "auth/invalid-email":
                    setError("Invalid characters in username.");
                    break;
                case "auth/weak-password":
                    setError("Password should be at least 6 characters.");
                    break;
                case "auth/user-not-found":
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    setError("Invalid username or password.");
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





    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

            {/* --- HERO SECTION --- */}
            <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20 lg:py-32">
                {/* Background Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                <div className="container relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24 items-center">

                    {/* Hero Content */}
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-8">
                        <div className="inline-flex items-center gap-2 brutal-border bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground brutal-shadow">
                            <Sparkles className="w-4 h-4 fill-primary-foreground" />
                            <span>AI-Powered Routine Tracker</span>
                        </div>
 
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-foreground">
                            Master Your <br />
                            <span className="text-primary bg-foreground px-4 py-2 brutal-border block mt-2 w-fit">Daily Flow</span>
                        </h1>
 
                        <p className="text-xl text-muted-foreground font-bold max-w-xl leading-snug brutal-border p-4 bg-muted/50">
                            Build rock-solid habits, track your progress, and achieve your goals with our intelligent focus engine and analytics.
                        </p>
 
                        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
                            <Button className="h-16 px-10 bg-primary text-primary-foreground text-xl">
                                Get Started <ArrowRight className="ml-2 w-6 h-6" />
                            </Button>
                            <Button variant="outline" className="h-16 px-10 text-xl border-foreground">
                                Learn More
                            </Button>
                        </div>

                        <div className="pt-8 flex items-center gap-8 text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                <span>Free to start</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                <span>Focus Engine</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-500" />
                                <span>AI Insights</span>
                            </div>
                        </div>
                    </div>

                    {/* Login/Signup Card */}
                    <div className="w-full max-w-md mx-auto lg:ml-auto space-y-8">
                        <div className="brutal-card p-10 brutal-shadow-lg scale-105 bg-card">
                            <div className="mb-8 text-center">
                                <h2 className="text-2xl font-bold text-foreground">
                                    {isRegistering ? "Create your account" : "Welcome back"}
                                </h2>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {isRegistering
                                        ? "Start your journey to better habits today."
                                        : "Enter your details to access your dashboard."}
                                </p>
                            </div>

                            {/* Google Sign In Button */}
                            <Button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full h-12 bg-background hover:bg-muted text-foreground font-semibold rounded-xl mb-6 flex items-center justify-center gap-3 transition-all border border-border"
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

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Input
                                    label="Username"
                                    type="text"
                                    required
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    leftIcon={<User className="w-4 h-4" />}
                                    className="bg-muted/50 border-border"
                                />
                                <div className="space-y-1">
                                    <Input
                                        label="Password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        leftIcon={<Lock className="w-4 h-4" />}
                                        className="bg-muted/50 border-border"
                                    />
                                    {isRegistering && <p className="text-xs text-muted-foreground ml-1">Must be at least 6 characters</p>}
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-all font-bold rounded-xl text-white shadow-lg shadow-purple-500/20"
                                >
                                    {loading ? "Processing..." : isRegistering ? "Create Account" : "Sign In"}
                                </Button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-sm font-bold uppercase text-muted-foreground">
                                    {isRegistering ? "Already have an account? " : "New to Routine Tracker? "}
                                    <button
                                        type="button"
                                        onClick={() => setIsRegistering(!isRegistering)}
                                        className="text-primary hover:underline"
                                    >
                                        {isRegistering ? "Sign In" : "Sign Up Free"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="py-24 border-y brutal-border bg-muted">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase leading-none">Everything you need to <span className="bg-primary px-3 brutal-border">excel</span></h2>
                        <p className="text-xl text-muted-foreground font-bold leading-tight">Our comprehensive suite of tools helps you manage time, track habits, and stay motivated every single day.</p>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <FeatureCard
                            icon={Timer}
                            title="Focus Engine"
                            description="Immersive timer with ambient sounds to help you enter deep work states effortlessly."
                        />
                        <FeatureCard
                            icon={Trophy}
                            title="Gamified Leaderboard"
                            description="Compete with friends and the global community. Earn streaks, badges, and rewards."
                        />
                        <FeatureCard
                            icon={Sparkles}
                            title="AI Assistant"
                            description="Smart insights about your productivity patterns and personalized routine suggestions."
                        />
                    </div>
                </div>
            </section>
 
            {/* --- HOW IT WORKS SECTION --- */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">How it works</h2>
                        <p className="font-bold text-muted-foreground uppercase tracking-widest">Three simple steps to a better you.</p>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <StepCard
                            number="1"
                            title="Create Routines"
                            description="Set up your daily habits and organize them into time blocks like Morning, Afternoon, and Night."
                        />
                        <StepCard
                            number="2"
                            title="Track & Focus"
                            description="Use the Focus Engine to execute tasks without distractions and mark them as complete."
                        />
                        <StepCard
                            number="3"
                            title="Analyze Growth"
                            description="View detailed analytics, maintain your streak, and climb the leaderboard."
                        />
                    </div>
                </div>
            </section>
 
            {/* --- FOOTER --- */}
            <footer className="py-16 border-t brutal-border bg-card">
                <div className="container mx-auto px-4 text-center">
                    <div className="flex items-center justify-center gap-4 mb-10">
                        <div className="h-12 w-12 brutal-border bg-primary flex items-center justify-center text-primary-foreground font-black text-xl brutal-shadow">
                            RT
                        </div>
                        <span className="text-3xl font-black uppercase tracking-tighter">Routine Tracker</span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-12 text-center max-w-sm mx-auto">
                        Designed to help you build consistency and achieve your full potential.
                    </p>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                        © 2026 Routine Tracker. All rights reserved.
                    </div>
                </div>
            </footer>

        </div>
    );
};

export { LandingPage };
