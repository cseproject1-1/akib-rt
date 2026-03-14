// ============================================================================
// STREAK RECALCULATION CRON JOB
// ============================================================================
// Runs at midnight daily to recalculate streaks and update leaderboard stats.
// Schedule: 0 0 * * * (Every day at 00:00 UTC)

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { format, subDays } from "date-fns";
import { logger } from "@/lib/logger";

// Verify Vercel Cron request
function verifyCronRequest(request: Request): boolean {
    const authHeader = request.headers.get("authorization");
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface Task {
    id: string;
    completionHistory: string[];
    days: string[];
    specificDate?: string;
}

export async function GET(request: Request) {
    if (process.env.NODE_ENV === "production") {
        if (!verifyCronRequest(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        logger.info("Streak recalculation cron started", { action: "cron/streak-recalculation" });

        const usersSnapshot = await getDocs(collection(db, "users"));
        let usersUpdated = 0;
        let errors = 0;

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

                // Calculate stats
                const stats = calculateUserStats(tasks);

                // Update user document
                await updateDoc(doc(db, "users", userId), {
                    totalCompleted: stats.totalCompleted,
                    completionRate: stats.completionRate,
                    streak: stats.streak,
                    lastStatsUpdate: new Date().toISOString(),
                });

                usersUpdated++;
            } catch (userError) {
                errors++;
                logger.warn(`Failed to update user stats`, userError);
            }
        }

        logger.info(`Streak recalculation completed: ${usersUpdated} users updated, ${errors} errors`, {
            action: "cron/streak-recalculation",
            metadata: { usersUpdated, errors },
        });

        return NextResponse.json({
            success: true,
            usersUpdated,
            errors,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error("Streak recalculation cron failed", error, { action: "cron/streak-recalculation" });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function calculateUserStats(tasks: Task[]) {
    // Total completed (all time)
    const totalCompleted = tasks.reduce((acc, t) => acc + (t.completionHistory?.length || 0), 0);

    // Completion rate (last 7 days)
    let scheduled = 0;
    let completed = 0;
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const dateToCheck = subDays(today, i);
        const dateStr = format(dateToCheck, "yyyy-MM-dd");
        const dayName = format(dateToCheck, "EEE").toUpperCase();

        tasks.forEach(t => {
            const isScheduled = t.specificDate
                ? t.specificDate === dateStr
                : t.days?.includes(dayName);

            if (isScheduled) {
                scheduled++;
                if (t.completionHistory?.includes(dateStr)) completed++;
            }
        });
    }
    const completionRate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

    // Streak (consecutive days with at least 1 completed task)
    let streak = 0;
    for (let i = 0; i < 365; i++) {
        const dateToCheck = subDays(today, i);
        const dateStr = format(dateToCheck, "yyyy-MM-dd");
        const anyTaskDone = tasks.some(t => t.completionHistory?.includes(dateStr));

        if (anyTaskDone) {
            streak++;
        } else {
            if (i === 0) continue; // Today doesn't break streak if nothing done yet
            break;
        }
    }

    return { totalCompleted, completionRate, streak };
}

export const dynamic = "force-dynamic";
