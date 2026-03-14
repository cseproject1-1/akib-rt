// ============================================================================
// WEEKLY SUMMARY CRON JOB
// ============================================================================
// Runs every Sunday at 9 AM to generate weekly analytics summaries.
// Schedule: 0 9 * * 0 (Every Sunday at 9:00 AM UTC)

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { logger } from "@/lib/logger";

// Verify Vercel Cron request
function verifyCronRequest(request: Request): boolean {
    const authHeader = request.headers.get("authorization");
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface Task {
    id: string;
    title: string;
    completionHistory: string[];
    days: string[];
}

export async function GET(request: Request) {
    if (process.env.NODE_ENV === "production") {
        if (!verifyCronRequest(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        logger.info("Weekly summary cron started", { action: "cron/weekly-summary" });

        const usersSnapshot = await getDocs(collection(db, "users"));
        let summariesGenerated = 0;

        const weekEnd = new Date();
        const weekStart = subDays(weekEnd, 7);

        for (const userDoc of usersSnapshot.docs) {
            try {
                const userId = userDoc.id;

                // Get user's tasks
                const tasksSnapshot = await getDocs(collection(db, "users", userId, "tasks"));
                const tasks: Task[] = tasksSnapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                } as Task));

                if (tasks.length === 0) continue;

                // Calculate weekly stats
                const weeklyStats = calculateWeeklyStats(tasks, weekStart, weekEnd);

                // Store weekly summary
                const summaryId = format(weekEnd, "yyyy-ww"); // e.g., "2026-02"
                await setDoc(doc(db, "users", userId, "weeklySummaries", summaryId), {
                    weekStart: weekStart.toISOString(),
                    weekEnd: weekEnd.toISOString(),
                    ...weeklyStats,
                    generatedAt: new Date().toISOString(),
                });

                summariesGenerated++;
            } catch (userError) {
                logger.warn(`Failed to generate weekly summary for user`, userError);
            }
        }

        logger.info(`Weekly summaries generated: ${summariesGenerated}`, {
            action: "cron/weekly-summary",
            metadata: { summariesGenerated },
        });

        return NextResponse.json({
            success: true,
            summariesGenerated,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error("Weekly summary cron failed", error, { action: "cron/weekly-summary" });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function calculateWeeklyStats(tasks: Task[], weekStart: Date, weekEnd: Date) {
    let totalScheduled = 0;
    let totalCompleted = 0;
    const taskPerformance: Record<string, { scheduled: number; completed: number }> = {};

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
        const dateToCheck = subDays(weekEnd, i);
        const dateStr = format(dateToCheck, "yyyy-MM-dd");
        const dayName = format(dateToCheck, "EEE").toUpperCase();

        tasks.forEach(t => {
            const isScheduled = t.days?.includes(dayName);
            const wasCompleted = t.completionHistory?.includes(dateStr);

            if (isScheduled) {
                totalScheduled++;
                if (!taskPerformance[t.id]) {
                    taskPerformance[t.id] = { scheduled: 0, completed: 0 };
                }
                taskPerformance[t.id].scheduled++;

                if (wasCompleted) {
                    totalCompleted++;
                    taskPerformance[t.id].completed++;
                }
            }
        });
    }

    // Find best and worst performing tasks
    const taskScores = Object.entries(taskPerformance).map(([id, stats]) => ({
        taskId: id,
        rate: stats.scheduled > 0 ? Math.round((stats.completed / stats.scheduled) * 100) : 0,
        ...stats,
    }));

    const sortedTasks = taskScores.sort((a, b) => b.rate - a.rate);
    const bestTask = sortedTasks[0] || null;
    const worstTask = sortedTasks[sortedTasks.length - 1] || null;

    return {
        totalScheduled,
        totalCompleted,
        completionRate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
        tasksTracked: tasks.length,
        bestPerformingTaskId: bestTask?.taskId,
        worstPerformingTaskId: worstTask?.taskId,
    };
}

export const dynamic = "force-dynamic";
