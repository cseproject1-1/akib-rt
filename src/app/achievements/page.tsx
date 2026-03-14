"use client";

import React from "react";
import { Header } from "@/components/Header";
import { LevelProgress } from "@/components/achievements/LevelProgress";
import { AchievementGrid } from "@/components/achievements/AchievementBadge";
import { WeeklyChallenges } from "@/components/achievements/WeeklyChallenges";
import { useAchievements } from "@/context/AchievementsContext";
import { Trophy, Medal, Target, Flame, Star, Sparkles } from "lucide-react";

export default function AchievementsPage() {
    const { unlockedAchievements, achievements, totalXP, level } = useAchievements();

    const categories = [
        { id: "all", label: "All", icon: Trophy },
        { id: "streak", label: "Streaks", icon: Flame },
        { id: "completion", label: "Completion", icon: Target },
        { id: "milestone", label: "Milestones", icon: Medal },
        { id: "special", label: "Special", icon: Star },
    ];

    const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

    const stats = [
        { label: "Unlocked", value: unlockedAchievements.length, icon: Trophy, color: "text-yellow-400" },
        { label: "Total", value: achievements.length, icon: Medal, color: "text-purple-400" },
        { label: "XP Earned", value: totalXP.toLocaleString(), icon: Sparkles, color: "text-emerald-400" },
    ];

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />
            <main className="container mx-auto max-w-6xl px-6 pt-12 space-y-10">
                {/* Header */}
                <div className="space-y-1">
                    <h2 className="text-4xl font-bold tracking-tighter text-foreground flex items-center gap-3">
                        <Trophy className="h-10 w-10 text-yellow-400" />
                        Achievements
                    </h2>
                    <p className="text-muted-foreground font-medium">Track your progress and unlock rewards</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Level & Challenges */}
                    <div className="space-y-6">
                        <LevelProgress variant="full" showXPDetails={true} />
                        <WeeklyChallenges />
                    </div>

                    {/* Right Column - Achievements */}
                    <div className="lg:col-span-2">
                        <div className="rounded-3xl bg-card border border-border p-6">
                            {/* Category Tabs */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat.id
                                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                                            }`}
                                    >
                                        <cat.icon className="h-4 w-4" />
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Achievement Grid */}
                            <AchievementGrid
                                category={selectedCategory as "all" | "streak" | "completion" | "milestone" | "special"}
                                showLocked={true}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
