// ============================================================================
// STATS API - CALCULATE USER STATS
// ============================================================================
// GET /api/stats/calculate
// Calculates and returns user statistics (streak, completion rate, etc.)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { format, subDays } from "date-fns";

interface Task {
    id: string;
    completionHistory: string[];
    days: string[];
    specificDate?: string;
}

export async function GET(request: NextRequest) {
    const rateLimitResponse = withRateLimit(request, { maxRequests: 30, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Get user's tasks
        const tasksSnapshot = await getDocs(collection(db, "users", userId, "tasks"));
        const tasks: Task[] = tasksSnapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        } as Task));

        const stats = calculateStats(tasks);

        logger.info("Stats calculated via API", {
            action: "GET /api/stats/calculate",
            metadata: { userId }
        });

        return NextResponse.json({
            success: true,
            ...stats
        });

    } catch (error: any) {
        logger.apiError("/api/stats/calculate", "GET", error, 500);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function calculateStats(tasks: Task[]) {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const dayName = format(today, "EEE").toUpperCase();

    // Total completed (all time)
    const totalCompleted = tasks.reduce((acc, t) => acc + (t.completionHistory?.length || 0), 0);

    // Tasks for today
    const tasksToday = tasks.filter(t =>
        t.specificDate ? t.specificDate === todayStr : t.days?.includes(dayName)
    );
    const totalTasksToday = tasksToday.length;
    const completedTasksToday = tasksToday.filter(t =>
        t.completionHistory?.includes(todayStr)
    ).length;

    // Daily progress
    const dailyProgress = totalTasksToday > 0
        ? Math.round((completedTasksToday / totalTasksToday) * 100)
        : 0;

    // Completion rate (last 7 days)
    let scheduled = 0;
    let completed = 0;

    for (let i = 0; i < 7; i++) {
        const dateToCheck = subDays(today, i);
        const dateStr = format(dateToCheck, "yyyy-MM-dd");
        const dayStr = format(dateToCheck, "EEE").toUpperCase();

        tasks.forEach(t => {
            const isScheduled = t.specificDate
                ? t.specificDate === dateStr
                : t.days?.includes(dayStr);

            if (isScheduled) {
                scheduled++;
                if (t.completionHistory?.includes(dateStr)) completed++;
            }
        });
    }
    const completionRate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

    // Streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
        const dateToCheck = subDays(today, i);
        const dateStr = format(dateToCheck, "yyyy-MM-dd");
        const anyTaskDone = tasks.some(t => t.completionHistory?.includes(dateStr));

        if (anyTaskDone) {
            streak++;
        } else {
            if (i === 0) continue;
            break;
        }
    }

    return {
        totalCompleted,
        totalTasksToday,
        completedTasksToday,
        dailyProgress,
        completionRate,
        streak,
        totalTasks: tasks.length,
    };
}
