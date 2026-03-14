"use client";

import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useTask, Task } from "./TaskContext";
import { useAuth } from "./AuthContext";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays } from "date-fns";

// ============================================================================
// ANALYTICS CONTEXT
// ============================================================================
// Centralized analytics engine for productivity metrics, heatmaps, and insights.

interface HeatmapDay {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4; // 0=none, 1=low, 2=medium, 3=high, 4=max
}

interface TimeBlockStats {
    block: string;
    completionRate: number;
    totalTasks: number;
    completedTasks: number;
}

interface DayOfWeekStats {
    day: string;
    completionRate: number;
    averageTasks: number;
}

interface ProductivityInsight {
    type: "positive" | "neutral" | "warning";
    message: string;
    metric?: string;
}

interface AnalyticsContextType {
    // Productivity Score (0-100)
    productivityScore: number;
    productivityTrend: "up" | "down" | "stable";

    // Heatmap Data
    getHeatmapData: (days?: number) => HeatmapDay[];

    // Time-of-Day Analysis
    getTimeBlockStats: () => TimeBlockStats[];
    getBestTimeBlock: () => string;

    // Day-of-Week Analysis
    getDayOfWeekStats: () => DayOfWeekStats[];
    getBestDayOfWeek: () => string;

    // Insights
    getInsights: () => ProductivityInsight[];

    // Streaks
    currentStreak: number;
    longestStreak: number;

    // Totals
    totalTasksCompleted: number;
    totalFocusMinutes: number;
    averageCompletionRate: number;

    // Weekly Stats
    thisWeekCompleted: number;
    thisWeekTotal: number;
    lastWeekCompleted: number;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tasks, getCompletionRate, calculateStreak } = useTask();
    const { user } = useAuth(); // Use the hook properly at top level!

    // Calculate total tasks completed (all time)
    const totalTasksCompleted = useMemo(() => {
        return tasks.reduce((sum, task) => sum + task.completionHistory.length, 0);
    }, [tasks]);

    // Current global streak (consecutive days with at least 1 task done)
    const currentStreak = useMemo(() => {
        const today = new Date();
        let streak = 0;

        for (let i = 0; i < 365; i++) {
            const dateStr = format(subDays(today, i), "yyyy-MM-dd");
            const anyTaskDone = tasks.some(t => t.completionHistory.includes(dateStr));

            if (anyTaskDone) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    }, [tasks]);

    // Longest streak ever
    const longestStreak = useMemo(() => {
        if (tasks.length === 0) return 0;

        // Get all completion dates across all tasks
        const allDates = new Set<string>();
        tasks.forEach(t => t.completionHistory.forEach(d => allDates.add(d)));

        if (allDates.size === 0) return 0;

        const sortedDates = Array.from(allDates).sort();
        let maxStreak = 1;
        let currentStrk = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diff = differenceInDays(currDate, prevDate);

            if (diff === 1) {
                currentStrk++;
                maxStreak = Math.max(maxStreak, currentStrk);
            } else {
                currentStrk = 1;
            }
        }

        return maxStreak;
    }, [tasks]);

    // Productivity Score (0-100)
    const productivityScore = useMemo(() => {
        const completionRate = getCompletionRate(7);
        const streakBonus = Math.min(currentStreak * 2, 20); // Max 20 points from streak
        const consistencyBonus = tasks.length > 0 ? 10 : 0;

        return Math.min(100, Math.round(completionRate * 0.7 + streakBonus + consistencyBonus));
    }, [getCompletionRate, currentStreak, tasks.length]);

    // Productivity Trend
    const productivityTrend = useMemo((): "up" | "down" | "stable" => {
        const thisWeek = getCompletionRate(7);
        const lastWeek = getCompletionRate(14) - getCompletionRate(7); // Crude estimation

        if (thisWeek > lastWeek + 5) return "up";
        if (thisWeek < lastWeek - 5) return "down";
        return "stable";
    }, [getCompletionRate]);

    // Average completion rate (30 days)
    const averageCompletionRate = useMemo(() => {
        return getCompletionRate(30);
    }, [getCompletionRate]);

    // Total focus minutes from Firestore
    const [totalFocusMinutes, setTotalFocusMinutes] = React.useState(0);

    // Fetch total focus minutes when tasks change
    React.useEffect(() => {
        if (!user) {
            setTotalFocusMinutes(0);
            return;
        }

        const loadFocusMinutes = async () => {
            try {
                const { getTotalFocusMinutes } = await import('@/lib/focusSessionUtils');
                const minutes = await getTotalFocusMinutes(user.uid);
                setTotalFocusMinutes(minutes);
            } catch (error) {
                console.error('Failed to load total focus minutes:', error);
            }
        };

        loadFocusMinutes();
    }, [user, tasks.length]);

    // Heatmap Data Generator
    const getHeatmapData = useCallback((days: number = 365): HeatmapDay[] => {
        const today = new Date();
        const heatmapData: HeatmapDay[] = [];

        // Find max completions per day for normalization
        let maxCompletions = 1;
        for (let i = 0; i < days; i++) {
            const dateStr = format(subDays(today, i), "yyyy-MM-dd");
            const count = tasks.filter(t => t.completionHistory.includes(dateStr)).length;
            maxCompletions = Math.max(maxCompletions, count);
        }

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(today, i);
            const dateStr = format(date, "yyyy-MM-dd");
            const count = tasks.filter(t => t.completionHistory.includes(dateStr)).length;

            // Calculate level (0-4) based on relative completion
            let level: 0 | 1 | 2 | 3 | 4 = 0;
            if (count > 0) {
                const ratio = count / maxCompletions;
                if (ratio <= 0.25) level = 1;
                else if (ratio <= 0.5) level = 2;
                else if (ratio <= 0.75) level = 3;
                else level = 4;
            }

            heatmapData.push({ date: dateStr, count, level });
        }

        return heatmapData;
    }, [tasks]);

    // Time Block Stats
    const getTimeBlockStats = useCallback((): TimeBlockStats[] => {
        const blocks = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];
        const today = new Date();

        return blocks.map(block => {
            const blockTasks = tasks.filter(t => t.timeBlock === block);
            let totalScheduled = 0;
            let totalCompleted = 0;

            // Check last 30 days
            for (let i = 0; i < 30; i++) {
                const dateStr = format(subDays(today, i), "yyyy-MM-dd");
                const dayName = format(subDays(today, i), "EEE").toUpperCase();

                blockTasks.forEach(t => {
                    if (t.days.includes(dayName)) {
                        totalScheduled++;
                        if (t.completionHistory.includes(dateStr)) {
                            totalCompleted++;
                        }
                    }
                });
            }

            return {
                block,
                completionRate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
                totalTasks: blockTasks.length,
                completedTasks: totalCompleted
            };
        });
    }, [tasks]);

    const getBestTimeBlock = useCallback((): string => {
        const stats = getTimeBlockStats();
        const best = stats.reduce((a, b) => a.completionRate > b.completionRate ? a : b, stats[0]);
        return best?.block || "Morning";
    }, [getTimeBlockStats]);

    // Day of Week Stats
    const getDayOfWeekStats = useCallback((): DayOfWeekStats[] => {
        const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const today = new Date();

        return days.map(day => {
            let totalScheduled = 0;
            let totalCompleted = 0;
            let dayCount = 0;

            // Check last 12 weeks
            for (let week = 0; week < 12; week++) {
                const dayIndex = days.indexOf(day);
                const date = subDays(today, (today.getDay() - dayIndex + 7) % 7 + week * 7);
                const dateStr = format(date, "yyyy-MM-dd");

                if (date <= today) {
                    dayCount++;
                    tasks.forEach(t => {
                        if (t.days.includes(day)) {
                            totalScheduled++;
                            if (t.completionHistory.includes(dateStr)) {
                                totalCompleted++;
                            }
                        }
                    });
                }
            }

            return {
                day,
                completionRate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
                averageTasks: dayCount > 0 ? Math.round((totalCompleted / dayCount) * 10) / 10 : 0
            };
        });
    }, [tasks]);

    const getBestDayOfWeek = useCallback((): string => {
        const stats = getDayOfWeekStats();
        const best = stats.reduce((a, b) => a.completionRate > b.completionRate ? a : b, stats[0]);
        return best?.day || "MON";
    }, [getDayOfWeekStats]);

    // Weekly Stats
    const { thisWeekCompleted, thisWeekTotal, lastWeekCompleted } = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today);
        const weekEnd = endOfWeek(today);
        const lastWeekStart = subDays(weekStart, 7);

        let thisCompleted = 0;
        let thisTotal = 0;
        let lastCompleted = 0;

        eachDayOfInterval({ start: weekStart, end: today }).forEach(date => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayName = format(date, "EEE").toUpperCase();

            tasks.forEach(t => {
                if (t.days.includes(dayName)) {
                    thisTotal++;
                    if (t.completionHistory.includes(dateStr)) {
                        thisCompleted++;
                    }
                }
            });
        });

        eachDayOfInterval({ start: lastWeekStart, end: subDays(weekStart, 1) }).forEach(date => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayName = format(date, "EEE").toUpperCase();

            tasks.forEach(t => {
                if (t.days.includes(dayName)) {
                    if (t.completionHistory.includes(dateStr)) {
                        lastCompleted++;
                    }
                }
            });
        });

        return { thisWeekCompleted: thisCompleted, thisWeekTotal: thisTotal, lastWeekCompleted: lastCompleted };
    }, [tasks]);

    // AI-Powered Insights
    const getInsights = useCallback((): ProductivityInsight[] => {
        const insights: ProductivityInsight[] = [];
        const bestBlock = getBestTimeBlock();
        const bestDay = getBestDayOfWeek();
        const timeStats = getTimeBlockStats();
        const dayStats = getDayOfWeekStats();

        // Best time block insight
        const bestBlockStat = timeStats.find(s => s.block === bestBlock);
        if (bestBlockStat && bestBlockStat.completionRate > 50) {
            insights.push({
                type: "positive",
                message: `Your peak productivity is during ${bestBlock} blocks (${bestBlockStat.completionRate}% completion). Consider scheduling important tasks here.`,
                metric: `${bestBlockStat.completionRate}%`
            });
        }

        // Best day insight
        const bestDayStat = dayStats.find(s => s.day === bestDay);
        if (bestDayStat && bestDayStat.completionRate > 50) {
            const dayName = { SUN: "Sunday", MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" }[bestDay];
            insights.push({
                type: "positive",
                message: `${dayName} is your most productive day with ${bestDayStat.completionRate}% completion rate.`,
                metric: `${bestDayStat.completionRate}%`
            });
        }

        // Streak insight
        if (currentStreak >= 7) {
            insights.push({
                type: "positive",
                message: `Amazing! You're on a ${currentStreak}-day streak. Keep the momentum going!`,
                metric: `${currentStreak} days`
            });
        } else if (currentStreak === 0) {
            insights.push({
                type: "warning",
                message: "Your streak broke! Complete a task today to start a new one.",
            });
        }

        // Weak time block insight
        const weakBlock = timeStats.find(s => s.completionRate < 40 && s.totalTasks > 0);
        if (weakBlock) {
            insights.push({
                type: "warning",
                message: `${weakBlock.block} tasks have only ${weakBlock.completionRate}% completion. Consider rescheduling them.`,
                metric: `${weakBlock.completionRate}%`
            });
        }

        // Overall improvement
        if (productivityTrend === "up") {
            insights.push({
                type: "positive",
                message: "Your productivity is trending upward! Great job staying consistent.",
            });
        }

        return insights;
    }, [getBestTimeBlock, getBestDayOfWeek, getTimeBlockStats, getDayOfWeekStats, currentStreak, productivityTrend]);

    return (
        <AnalyticsContext.Provider
            value={{
                productivityScore,
                productivityTrend,
                getHeatmapData,
                getTimeBlockStats,
                getBestTimeBlock,
                getDayOfWeekStats,
                getBestDayOfWeek,
                getInsights,
                currentStreak,
                longestStreak,
                totalTasksCompleted,
                totalFocusMinutes,
                averageCompletionRate,
                thisWeekCompleted,
                thisWeekTotal,
                lastWeekCompleted,
            }}
        >
            {children}
        </AnalyticsContext.Provider>
    );
};

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error("useAnalytics must be used within an AnalyticsProvider");
    }
    return context;
};

