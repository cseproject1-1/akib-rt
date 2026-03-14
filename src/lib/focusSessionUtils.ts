// ============================================================================
// FOCUS SESSION FIRESTORE UTILITIES
// ============================================================================
// Handles all Firestore operations for focus sessions including CRUD,
// analytics, and real-time stats calculations.

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    Timestamp,
    serverTimestamp,
    limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { withRetry, handleFirestoreError, showSuccess } from "./firestoreUtils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FocusSession {
    id: string;
    userId: string;
    startTime: Timestamp;
    endTime?: Timestamp;
    duration: number; // minutes
    sessionType: "focus" | "shortBreak" | "longBreak";
    preset: "classic" | "deepWork" | "sprint" | "custom";
    linkedTaskId?: string;
    linkedTaskTitle?: string;
    completed: boolean;
    abandoned: boolean;
    ambient?: string;
    notes?: string;
    distractions?: DistractionData;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface DistractionData {
    totalBlurTime: number; // seconds
    blurCount: number;
    focusPercentage: number;
    isPerfectFocus: boolean;
}

export interface FocusPreset {
    id: "classic" | "deepWork" | "sprint" | "custom";
    name: string;
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    description: string;
}

export interface DailyFocusStats {
    date: string;
    totalMinutes: number;
    totalSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    perfectFocusSessions: number;
    averageFocusPercentage: number;
}

export interface WeeklyFocusStats {
    weekStart: string;
    weekEnd: string;
    dailyStats: DailyFocusStats[];
    totalMinutes: number;
    totalSessions: number;
    averageMinutesPerDay: number;
    completionRate: number;
    bestDay: { date: string; minutes: number } | null;
}

export interface EnergyPattern {
    hour: number;
    averageFocusPercentage: number;
    sessionCount: number;
    totalMinutes: number;
    energyLevel: "high" | "medium" | "low";
}

// ============================================================================
// FOCUS PRESETS
// ============================================================================

export const FOCUS_PRESETS: FocusPreset[] = [
    {
        id: "classic",
        name: "Classic Pomodoro",
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        description: "Traditional 25/5/15 rhythm for balanced productivity",
    },
    {
        id: "deepWork",
        name: "Deep Work",
        focusMinutes: 50,
        shortBreakMinutes: 10,
        longBreakMinutes: 30,
        description: "Extended focus blocks for complex tasks",
    },
    {
        id: "sprint",
        name: "Sprint",
        focusMinutes: 15,
        shortBreakMinutes: 3,
        longBreakMinutes: 10,
        description: "Rapid iteration for quick wins",
    },
    {
        id: "custom",
        name: "Custom",
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        description: "Define your own rhythm",
    },
];

// ============================================================================
// SESSION CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new focus session in Firestore
 */
export async function createFocusSession(
    userId: string,
    data: {
        sessionType: "focus" | "shortBreak" | "longBreak";
        duration: number;
        preset: "classic" | "deepWork" | "sprint" | "custom";
        linkedTaskId?: string;
        linkedTaskTitle?: string;
    }
): Promise<string> {
    try {
        const sessionData = {
            userId,
            startTime: serverTimestamp(),
            duration: data.duration,
            sessionType: data.sessionType,
            preset: data.preset,
            linkedTaskId: data.linkedTaskId || null,
            linkedTaskTitle: data.linkedTaskTitle || null,
            completed: false,
            abandoned: false,
            ambient: null,
            notes: null,
            distractions: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await withRetry(
            () => addDoc(collection(db, `users/${userId}/focusSessions`), sessionData),
            { operationName: "Create focus session", silent: true }
        );

        return docRef.id;
    } catch (error) {
        handleFirestoreError(error, "Failed to start focus session");
        throw error;
    }
}

/**
 * Updates an existing focus session
 */
export async function updateFocusSession(
    userId: string,
    sessionId: string,
    updates: Partial<{
        completed: boolean;
        abandoned: boolean;
        ambient: string;
        notes: string;
        distractions: DistractionData;
        endTime: Timestamp;
    }>
): Promise<void> {
    try {
        const sessionRef = doc(db, `users/${userId}/focusSessions`, sessionId);

        await withRetry(
            () =>
                updateDoc(sessionRef, {
                    ...updates,
                    updatedAt: serverTimestamp(),
                }),
            { operationName: "Update focus session", silent: true }
        );
    } catch (error) {
        handleFirestoreError(error, "Failed to update focus session");
        throw error;
    }
}

/**
 * Completes a focus session with final stats
 */
export async function completeFocusSession(
    userId: string,
    sessionId: string,
    data: {
        completed: boolean;
        distractions?: DistractionData;
        notes?: string;
    }
): Promise<void> {
    try {
        await updateFocusSession(userId, sessionId, {
            completed: data.completed,
            abandoned: !data.completed,
            distractions: data.distractions || undefined,
            notes: data.notes || undefined,
            endTime: Timestamp.now(),
        });

        if (data.completed) {
            showSuccess("Focus session complete! 🎉");
        }
    } catch (error) {
        handleFirestoreError(error, "Failed to complete session");
        throw error;
    }
}

/**
 * Gets the last incomplete session (for resume functionality)
 */
export async function getIncompleteSession(
    userId: string
): Promise<FocusSession | null> {
    try {
        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("completed", "==", false),
            where("abandoned", "==", false),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
        } as FocusSession;
    } catch (error) {
        console.error("Failed to get incomplete session:", error);
        return null;
    }
}

// ============================================================================
// ANALYTICS & STATS
// ============================================================================

/**
 * Gets today's focus stats
 */
export async function getTodayFocusStats(
    userId: string
): Promise<{ minutes: number; sessions: number }> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("completed", "==", true),
            where("createdAt", ">=", Timestamp.fromDate(today)),
            where("createdAt", "<", Timestamp.fromDate(tomorrow))
        );

        const snapshot = await getDocs(q);

        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);
        const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

        return {
            minutes: totalMinutes,
            sessions: sessions.length,
        };
    } catch (error) {
        console.error("Failed to get today's stats:", error);
        return { minutes: 0, sessions: 0 };
    }
}

/**
 * Gets focus stats for the last 7 days
 */
export async function getWeeklyFocusStats(
    userId: string
): Promise<WeeklyFocusStats> {
    try {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("createdAt", ">=", Timestamp.fromDate(startDate)),
            where("createdAt", "<=", Timestamp.fromDate(endDate))
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        // Group by day
        const dailyStatsMap = new Map<string, DailyFocusStats>();

        // Initialize all 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toDateString();

            dailyStatsMap.set(dateStr, {
                date: dateStr,
                totalMinutes: 0,
                totalSessions: 0,
                completedSessions: 0,
                abandonedSessions: 0,
                perfectFocusSessions: 0,
                averageFocusPercentage: 0,
            });
        }

        // Aggregate sessions
        sessions.forEach((session) => {
            const dateStr = session.createdAt.toDate().toDateString();
            const stats = dailyStatsMap.get(dateStr);

            if (stats) {
                stats.totalSessions++;
                if (session.completed) {
                    stats.totalMinutes += session.duration;
                    stats.completedSessions++;
                    if (session.distractions?.isPerfectFocus) {
                        stats.perfectFocusSessions++;
                    }
                }
                if (session.abandoned) {
                    stats.abandonedSessions++;
                }
            }
        });

        // Calculate averages
        dailyStatsMap.forEach((stats) => {
            const completedSessions = sessions.filter(
                (s) =>
                    s.createdAt.toDate().toDateString() === stats.date && s.completed
            );

            if (completedSessions.length > 0) {
                const avgFocus =
                    completedSessions.reduce(
                        (sum, s) => sum + (s.distractions?.focusPercentage || 100),
                        0
                    ) / completedSessions.length;
                stats.averageFocusPercentage = Math.round(avgFocus);
            }
        });

        const dailyStats = Array.from(dailyStatsMap.values());
        const totalMinutes = dailyStats.reduce((sum, d) => sum + d.totalMinutes, 0);
        const totalSessions = sessions.filter((s) => s.completed).length;
        const totalAttempts = sessions.length;
        const completionRate =
            totalAttempts > 0 ? Math.round((totalSessions / totalAttempts) * 100) : 0;

        const bestDay = dailyStats.reduce(
            (best, day) => {
                if (day.totalMinutes > (best?.minutes || 0)) {
                    return { date: day.date, minutes: day.totalMinutes };
                }
                return best;
            },
            null as { date: string; minutes: number } | null
        );

        return {
            weekStart: startDate.toDateString(),
            weekEnd: endDate.toDateString(),
            dailyStats,
            totalMinutes,
            totalSessions,
            averageMinutesPerDay: Math.round(totalMinutes / 7),
            completionRate,
            bestDay,
        };
    } catch (error) {
        console.error("Failed to get weekly stats:", error);
        return {
            weekStart: "",
            weekEnd: "",
            dailyStats: [],
            totalMinutes: 0,
            totalSessions: 0,
            averageMinutesPerDay: 0,
            completionRate: 0,
            bestDay: null,
        };
    }
}

/**
 * Analyzes energy patterns by hour of day
 */
export async function getEnergyPatterns(
    userId: string,
    days: number = 30
): Promise<EnergyPattern[]> {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("completed", "==", true),
            where("createdAt", ">=", Timestamp.fromDate(startDate))
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        // Group by hour
        const hourlyData = new Map<number, {
            totalFocus: number;
            count: number;
            minutes: number;
        }>();

        // Initialize all 24 hours
        for (let i = 0; i < 24; i++) {
            hourlyData.set(i, { totalFocus: 0, count: 0, minutes: 0 });
        }

        // Aggregate by hour
        sessions.forEach((session) => {
            const hour = session.createdAt.toDate().getHours();
            const data = hourlyData.get(hour)!;

            data.count++;
            data.minutes += session.duration;
            data.totalFocus += session.distractions?.focusPercentage || 100;
        });

        // Convert to energy patterns
        const patterns: EnergyPattern[] = [];
        hourlyData.forEach((data, hour) => {
            const avgFocus = data.count > 0 ? data.totalFocus / data.count : 0;

            let energyLevel: "high" | "medium" | "low";
            if (avgFocus >= 90) energyLevel = "high";
            else if (avgFocus >= 75) energyLevel = "medium";
            else energyLevel = "low";

            patterns.push({
                hour,
                averageFocusPercentage: Math.round(avgFocus),
                sessionCount: data.count,
                totalMinutes: data.minutes,
                energyLevel,
            });
        });

        return patterns.sort((a, b) => a.hour - b.hour);
    } catch (error) {
        console.error("Failed to get energy patterns:", error);
        return [];
    }
}

/**
 * Gets total focus minutes (for achievements)
 */
export async function getTotalFocusMinutes(userId: string): Promise<number> {
    try {
        const sessionsRef = collection(db, `users/${userId}/focusSessions`);
        const q = query(
            sessionsRef,
            where("sessionType", "==", "focus"),
            where("completed", "==", true)
        );

        const snapshot = await getDocs(q);
        const sessions = snapshot.docs.map((doc) => doc.data() as FocusSession);

        return sessions.reduce((sum, s) => sum + s.duration, 0);
    } catch (error) {
        console.error("Failed to get total focus minutes:", error);
        return 0;
    }
}
