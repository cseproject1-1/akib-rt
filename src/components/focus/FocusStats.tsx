"use client";

import React, { useEffect, useState } from "react";
import { Timer, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getWeeklyFocusStats, WeeklyFocusStats } from "@/lib/focusSessionUtils";

interface FocusStatsProps {
    todayMinutes: number;
    todaySessions: number;
}

export const FocusStats: React.FC<FocusStatsProps> = ({
    todayMinutes,
    todaySessions,
}) => {
    const { user } = useAuth();
    const [weeklyStats, setWeeklyStats] = useState<WeeklyFocusStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadWeeklyStats = async () => {
            try {
                const stats = await getWeeklyFocusStats(user.uid);
                setWeeklyStats(stats);
            } catch (error) {
                console.error("Failed to load weekly stats:", error);
            } finally {
                setLoading(false);
            }
        };

        loadWeeklyStats();
    }, [user, todayMinutes]); // Reload when today's minutes change

    const formatTime = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // Prepare weekly data for chart
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyData = weeklyStats
        ? dayNames.map((dayName, index) => {
            const dayStats = weeklyStats.dailyStats[index];
            return {
                day: dayName,
                minutes: dayStats?.totalMinutes || 0,
            };
        })
        : dayNames.map((day) => ({ day, minutes: 0 }));

    const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 90);
    const totalWeeklyMinutes = weeklyStats?.totalMinutes || 0;
    const avgMinutesPerDay = weeklyStats?.averageMinutesPerDay || 0;

    // Determine current day index (0-6, Mon-Sun)
    const getCurrentDayIndex = () => {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Sunday=6
    };

    const currentDayIndex = getCurrentDayIndex();

    if (loading) {
        return (
            <div className="rounded-3xl bg-card border border-border p-6 space-y-6 animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
                <div className="h-32 bg-muted rounded-lg" />
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-card border border-border p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Timer className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">Focus Statistics</h3>
                    <p className="text-xs text-muted-foreground">Track your deep work</p>
                </div>
            </div>

            {/* Today's Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-muted-foreground">Today</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {formatTime(todayMinutes)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {todaySessions} sessions
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-muted-foreground">Weekly Avg</span>
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {formatTime(avgMinutesPerDay)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">per day</p>
                </div>
            </div>

            {/* Weekly Chart */}
            <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    This Week
                </h4>
                <div className="flex items-end justify-between gap-2 h-24">
                    {weeklyData.map((day, i) => {
                        const height = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                        const isToday = i === currentDayIndex;

                        return (
                            <div
                                key={day.day}
                                className="flex flex-col items-center flex-1 gap-2 group relative"
                            >
                                <div className="relative w-full flex justify-center">
                                    <div
                                        className={`
                      w-8 rounded-t-lg transition-all duration-500
                      ${isToday
                                                ? "bg-gradient-to-t from-purple-500 to-pink-500"
                                                : day.minutes > 0
                                                    ? "bg-white/10 hover:bg-white/20"
                                                    : "bg-white/5"
                                            }
                    `}
                                        style={{ height: `${Math.max(height, 4)}px` }}
                                    />

                                    {/* Tooltip */}
                                    {day.minutes > 0 && (
                                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <div className="bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                                {formatTime(day.minutes)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] font-medium ${isToday ? "text-purple-400" : "text-muted-foreground"
                                        }`}
                                >
                                    {day.day[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Total Weekly */}
            <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total this week</span>
                    <span className="text-lg font-bold text-foreground">
                        {formatTime(totalWeeklyMinutes)}
                    </span>
                </div>

                {weeklyStats && weeklyStats.completionRate > 0 && (
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                            Session completion
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                            {weeklyStats.completionRate}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
