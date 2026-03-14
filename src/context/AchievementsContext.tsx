"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useTask } from "./TaskContext";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { format, subDays, differenceInDays } from "date-fns";

// ============================================================================
// ACHIEVEMENTS CONTEXT
// ============================================================================
// Gamification system: Achievements, XP, Levels, and Weekly Challenges

// Achievement Definitions
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: "streak" | "completion" | "milestone" | "special";
    condition: (stats: UserStats) => boolean;
    xpReward: number;
    unlockedAt?: string;
}

export interface WeeklyChallenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    target: number;
    current: number;
    rewardXP: number;
    expiresAt: string;
}

interface UserStats {
    totalCompleted: number;
    currentStreak: number;
    longestStreak: number;
    completionRate7d: number;
    totalTasks: number;
    morningCompleted: number;
    eveningCompleted: number;
    weekendCompleted: number;
    perfectDays: number;
    goalsCompleted: number;
    focusMinutes: number;
}

interface UserProgress {
    level: number;
    currentXP: number;
    totalXP: number;
    unlockedAchievements: string[];
    achievementDates: Record<string, string>;
    weeklyChallengeProgress: Record<string, number>;
}

interface AchievementsContextType {
    // User Progress
    level: number;
    currentXP: number;
    xpToNextLevel: number;
    totalXP: number;
    levelName: string;

    // Achievements
    achievements: Achievement[];
    unlockedAchievements: Achievement[];
    lockedAchievements: Achievement[];
    recentUnlock: Achievement | null;
    clearRecentUnlock: () => void;

    // Weekly Challenges
    weeklyChallenges: WeeklyChallenge[];

    // Actions
    checkAchievements: () => void;
    addXP: (amount: number, reason?: string) => void;
}

// Level thresholds
const LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
    10000, 13000, 17000, 22000, 28000, 35000, 45000, 60000, 80000, 100000
];

const LEVEL_NAMES = [
    "Beginner", "Apprentice", "Practitioner", "Achiever", "Dedicated",
    "Committed", "Disciplined", "Master", "Expert", "Virtuoso",
    "Elite", "Champion", "Legend", "Mythic", "Transcendent",
    "Grandmaster", "Supreme", "Ultimate", "Immortal", "Ascended"
];

// Achievement Definitions
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlockedAt">[] = [
    // Streak Achievements
    {
        id: "streak_3",
        name: "Getting Started",
        description: "Complete tasks 3 days in a row",
        icon: "🔥",
        category: "streak",
        condition: (s) => s.currentStreak >= 3,
        xpReward: 50
    },
    {
        id: "streak_7",
        name: "7-Day Warrior",
        description: "Complete tasks 7 days in a row",
        icon: "⚔️",
        category: "streak",
        condition: (s) => s.currentStreak >= 7,
        xpReward: 100
    },
    {
        id: "streak_14",
        name: "Fortnight Fighter",
        description: "Maintain a 14-day streak",
        icon: "🛡️",
        category: "streak",
        condition: (s) => s.currentStreak >= 14,
        xpReward: 200
    },
    {
        id: "streak_30",
        name: "Unstoppable",
        description: "Maintain a 30-day streak",
        icon: "💪",
        category: "streak",
        condition: (s) => s.currentStreak >= 30,
        xpReward: 500
    },
    {
        id: "streak_100",
        name: "Centurion",
        description: "Reach a 100-day streak",
        icon: "👑",
        category: "streak",
        condition: (s) => s.currentStreak >= 100,
        xpReward: 2000
    },

    // Completion Achievements
    {
        id: "complete_10",
        name: "Lift Off",
        description: "Complete your first 10 tasks",
        icon: "🚀",
        category: "milestone",
        condition: (s) => s.totalCompleted >= 10,
        xpReward: 50
    },
    {
        id: "complete_50",
        name: "Getting Productive",
        description: "Complete 50 tasks total",
        icon: "📈",
        category: "milestone",
        condition: (s) => s.totalCompleted >= 50,
        xpReward: 100
    },
    {
        id: "complete_100",
        name: "Century Club",
        description: "Complete 100 tasks",
        icon: "💯",
        category: "milestone",
        condition: (s) => s.totalCompleted >= 100,
        xpReward: 250
    },
    {
        id: "complete_500",
        name: "Task Master",
        description: "Complete 500 tasks",
        icon: "🏆",
        category: "milestone",
        condition: (s) => s.totalCompleted >= 500,
        xpReward: 750
    },
    {
        id: "complete_1000",
        name: "Legendary",
        description: "Complete 1000 tasks",
        icon: "⭐",
        category: "milestone",
        condition: (s) => s.totalCompleted >= 1000,
        xpReward: 2000
    },

    // Completion Rate Achievements
    {
        id: "rate_50",
        name: "Halfway There",
        description: "Achieve 50% weekly completion rate",
        icon: "📊",
        category: "completion",
        condition: (s) => s.completionRate7d >= 50,
        xpReward: 30
    },
    {
        id: "rate_80",
        name: "High Achiever",
        description: "Achieve 80% weekly completion rate",
        icon: "🎯",
        category: "completion",
        condition: (s) => s.completionRate7d >= 80,
        xpReward: 100
    },
    {
        id: "perfect_week",
        name: "Perfect Week",
        description: "Achieve 100% completion rate for 7 days",
        icon: "✨",
        category: "completion",
        condition: (s) => s.completionRate7d === 100,
        xpReward: 300
    },

    // Special Achievements
    {
        id: "early_bird",
        name: "Early Bird",
        description: "Complete 10 morning tasks",
        icon: "🌅",
        category: "special",
        condition: (s) => s.morningCompleted >= 10,
        xpReward: 75
    },
    {
        id: "night_owl",
        name: "Night Owl",
        description: "Complete 10 evening/night tasks",
        icon: "🦉",
        category: "special",
        condition: (s) => s.eveningCompleted >= 10,
        xpReward: 75
    },
    {
        id: "weekend_warrior",
        name: "Weekend Warrior",
        description: "Complete 20 weekend tasks",
        icon: "🎉",
        category: "special",
        condition: (s) => s.weekendCompleted >= 20,
        xpReward: 100
    },
    {
        id: "routine_builder",
        name: "Routine Builder",
        description: "Create 10 recurring tasks",
        icon: "🔄",
        category: "special",
        condition: (s) => s.totalTasks >= 10,
        xpReward: 50
    },
    {
        id: "goal_setter",
        name: "Goal Setter",
        description: "Complete your first goal",
        icon: "🎯",
        category: "special",
        condition: (s) => s.goalsCompleted >= 1,
        xpReward: 100
    },
    {
        id: "goal_crusher",
        name: "Goal Crusher",
        description: "Complete 5 goals",
        icon: "💎",
        category: "special",
        condition: (s) => s.goalsCompleted >= 5,
        xpReward: 500
    },
    {
        id: "focus_starter",
        name: "Focus Initiate",
        description: "Complete 60 minutes of focus time",
        icon: "🧘",
        category: "special",
        condition: (s) => s.focusMinutes >= 60,
        xpReward: 50
    },
    {
        id: "focus_master",
        name: "Focus Master",
        description: "Complete 600 minutes (10 hours) of focus time",
        icon: "🧠",
        category: "special",
        condition: (s) => s.focusMinutes >= 600,
        xpReward: 300
    },
    {
        id: "perfect_day_5",
        name: "Flawless Five",
        description: "Achieve 5 perfect days (100% completion)",
        icon: "🌟",
        category: "completion",
        condition: (s) => s.perfectDays >= 5,
        xpReward: 150
    },
    {
        id: "perfect_day_30",
        name: "Month of Mastery",
        description: "Achieve 30 perfect days",
        icon: "🏅",
        category: "completion",
        condition: (s) => s.perfectDays >= 30,
        xpReward: 1000
    },
];

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tasks, getCompletionRate } = useTask();
    const { user } = useAuth();

    const [progress, setProgress] = useState<UserProgress>({
        level: 1,
        currentXP: 0,
        totalXP: 0,
        unlockedAchievements: [],
        achievementDates: {},
        weeklyChallengeProgress: {}
    });

    const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
    const [focusMinutes, setFocusMinutes] = useState(0);

    // Load progress from Firestore
    useEffect(() => {
        if (!user) return;

        const loadProgress = async () => {
            try {
                const docRef = doc(db, "users", user.uid, "gamification", "progress");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProgress(docSnap.data() as UserProgress);
                }

                // Also load focus minutes
                const { getTotalFocusMinutes } = await import('@/lib/focusSessionUtils');
                const minutes = await getTotalFocusMinutes(user.uid);
                setFocusMinutes(minutes);
            } catch (error) {
                console.error("Failed to load gamification progress:", error);
            }
        };

        loadProgress();
    }, [user]);

    // Reload focus minutes when tasks change (as indicator of activity)
    useEffect(() => {
        if (!user) return;

        const reloadFocusMinutes = async () => {
            try {
                const { getTotalFocusMinutes } = await import('@/lib/focusSessionUtils');
                const minutes = await getTotalFocusMinutes(user.uid);
                setFocusMinutes(minutes);
            } catch (error) {
                console.error("Failed to reload focus minutes:", error);
            }
        };

        reloadFocusMinutes();
    }, [user, tasks.length]); // Reload when task count changes

    // Save progress to Firestore
    const saveProgress = useCallback(async (newProgress: UserProgress) => {
        if (!user) return;

        try {
            const docRef = doc(db, "users", user.uid, "gamification", "progress");
            await setDoc(docRef, newProgress, { merge: true });
        } catch (error) {
            console.error("Failed to save gamification progress:", error);
        }
    }, [user]);

    // Calculate user stats from tasks
    const userStats = useMemo((): UserStats => {
        const today = new Date();

        // Total completed
        const totalCompleted = tasks.reduce((sum, t) => sum + t.completionHistory.length, 0);

        // Current streak
        let currentStreak = 0;
        for (let i = 0; i < 365; i++) {
            const dateStr = format(subDays(today, i), "yyyy-MM-dd");
            const anyTaskDone = tasks.some(t => t.completionHistory.includes(dateStr));
            if (anyTaskDone) currentStreak++;
            else if (i > 0) break;
        }

        // Longest streak
        const allDates = new Set<string>();
        tasks.forEach(t => t.completionHistory.forEach(d => allDates.add(d)));
        const sortedDates = Array.from(allDates).sort();
        let longestStreak = sortedDates.length > 0 ? 1 : 0;
        let tempStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const diff = differenceInDays(new Date(sortedDates[i]), new Date(sortedDates[i - 1]));
            if (diff === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }

        // Morning and evening completed
        const morningBlocks = ["Dawn", "Morning"];
        const eveningBlocks = ["Evening", "Night"];
        const morningCompleted = tasks
            .filter(t => morningBlocks.includes(t.timeBlock))
            .reduce((sum, t) => sum + t.completionHistory.length, 0);
        const eveningCompleted = tasks
            .filter(t => eveningBlocks.includes(t.timeBlock))
            .reduce((sum, t) => sum + t.completionHistory.length, 0);

        // Weekend completed
        let weekendCompleted = 0;
        tasks.forEach(t => {
            t.completionHistory.forEach(dateStr => {
                const day = new Date(dateStr).getDay();
                if (day === 0 || day === 6) weekendCompleted++;
            });
        });

        // Perfect days count
        let perfectDays = 0;
        for (let i = 0; i < 365; i++) {
            const date = subDays(today, i);
            const dateStr = format(date, "yyyy-MM-dd");
            const dayName = format(date, "EEE").toUpperCase();

            const scheduledToday = tasks.filter(t => t.days.includes(dayName));
            if (scheduledToday.length === 0) continue;

            const completedToday = scheduledToday.filter(t => t.completionHistory.includes(dateStr));
            if (completedToday.length === scheduledToday.length) {
                perfectDays++;
            }
        }

        return {
            totalCompleted,
            currentStreak,
            longestStreak,
            completionRate7d: getCompletionRate(7),
            totalTasks: tasks.length,
            morningCompleted,
            eveningCompleted,
            weekendCompleted,
            perfectDays,
            goalsCompleted: 0, // TODO: integrate with GoalContext
            focusMinutes, // NOW USING REAL DATA!
        };
    }, [tasks, getCompletionRate, focusMinutes]);

    // Calculate level from XP
    const level = useMemo(() => {
        let lvl = 1;
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (progress.totalXP >= LEVEL_THRESHOLDS[i]) {
                lvl = i + 1;
                break;
            }
        }
        return Math.min(lvl, 20);
    }, [progress.totalXP]);

    const xpToNextLevel = useMemo(() => {
        if (level >= 20) return 0;
        return LEVEL_THRESHOLDS[level] - progress.totalXP;
    }, [level, progress.totalXP]);

    const currentXP = useMemo(() => {
        if (level >= 20) return progress.totalXP - LEVEL_THRESHOLDS[19];
        const prevThreshold = level > 1 ? LEVEL_THRESHOLDS[level - 1] : 0;
        return progress.totalXP - prevThreshold;
    }, [level, progress.totalXP]);

    const levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];

    // Build achievements list with unlock status
    const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(a => ({
        ...a,
        unlockedAt: progress.achievementDates[a.id]
    }));

    const unlockedAchievements = achievements.filter(a => progress.unlockedAchievements.includes(a.id));
    const lockedAchievements = achievements.filter(a => !progress.unlockedAchievements.includes(a.id));

    // Check and unlock achievements
    const checkAchievements = useCallback(() => {
        const newUnlocks: Achievement[] = [];

        lockedAchievements.forEach(achievement => {
            if (achievement.condition(userStats)) {
                newUnlocks.push(achievement);
            }
        });

        if (newUnlocks.length > 0) {
            const now = new Date().toISOString();
            const newProgress = {
                ...progress,
                unlockedAchievements: [...progress.unlockedAchievements, ...newUnlocks.map(a => a.id)],
                achievementDates: {
                    ...progress.achievementDates,
                    ...Object.fromEntries(newUnlocks.map(a => [a.id, now]))
                },
                totalXP: progress.totalXP + newUnlocks.reduce((sum, a) => sum + a.xpReward, 0)
            };

            setProgress(newProgress);
            saveProgress(newProgress);

            // Show most recent unlock
            setRecentUnlock(newUnlocks[0]);
        }
    }, [lockedAchievements, userStats, progress, saveProgress]);

    // Check achievements when stats change
    useEffect(() => {
        if (user && tasks.length > 0) {
            checkAchievements();
        }
    }, [userStats.totalCompleted, userStats.currentStreak, user]);

    // Add XP manually
    const addXP = useCallback((amount: number, reason?: string) => {
        const newProgress = {
            ...progress,
            totalXP: progress.totalXP + amount
        };
        setProgress(newProgress);
        saveProgress(newProgress);
    }, [progress, saveProgress]);

    // Clear recent unlock notification
    const clearRecentUnlock = useCallback(() => {
        setRecentUnlock(null);
    }, []);

    // Weekly Challenges (simplified - generates based on current week)
    const weeklyChallenges = useMemo((): WeeklyChallenge[] => {
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

        return [
            {
                id: "weekly_complete_20",
                title: "Weekly Warrior",
                description: "Complete 20 tasks this week",
                icon: "⚔️",
                target: 20,
                current: Math.min(userStats.totalCompleted, 20), // Simplified
                rewardXP: 100,
                expiresAt: endOfWeek.toISOString()
            },
            {
                id: "weekly_streak_5",
                title: "Stay Consistent",
                description: "Maintain a 5-day streak",
                icon: "🔥",
                target: 5,
                current: Math.min(userStats.currentStreak, 5),
                rewardXP: 75,
                expiresAt: endOfWeek.toISOString()
            },
            {
                id: "weekly_rate_70",
                title: "High Performance",
                description: "Achieve 70% completion rate",
                icon: "📈",
                target: 70,
                current: userStats.completionRate7d,
                rewardXP: 50,
                expiresAt: endOfWeek.toISOString()
            }
        ];
    }, [userStats]);

    return (
        <AchievementsContext.Provider
            value={{
                level,
                currentXP,
                xpToNextLevel,
                totalXP: progress.totalXP,
                levelName,
                achievements,
                unlockedAchievements,
                lockedAchievements,
                recentUnlock,
                clearRecentUnlock,
                weeklyChallenges,
                checkAchievements,
                addXP,
            }}
        >
            {children}
        </AchievementsContext.Provider>
    );
};

export const useAchievements = () => {
    const context = useContext(AchievementsContext);
    if (context === undefined) {
        throw new Error("useAchievements must be used within an AchievementsProvider");
    }
    return context;
};
