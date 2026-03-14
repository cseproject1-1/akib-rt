// ============================================================================
// TASK REMINDER CRON JOB (Hobby Plan Compatible)
// ============================================================================
// Runs daily at 5 AM to prepare the day's reminder schedule for all users.
// Schedule: 0 5 * * * (Once daily at 5:00 AM UTC)
//
// This job prepares notifications in Firestore that the client-side
// NotificationManager can check and deliver throughout the day.

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { format, addMinutes, parse } from "date-fns";
import { logger } from "@/lib/logger";

// Verify Vercel Cron request
function verifyCronRequest(request: Request): boolean {
    const authHeader = request.headers.get("authorization");
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface Task {
    id: string;
    title: string;
    startTime: string;
    days: string[];
    reminder?: string;
    icon?: string;
}

interface ScheduledReminder {
    taskId: string;
    taskTitle: string;
    taskIcon: string;
    startTime: string;
    reminderTime: string;
    delivered: boolean;
}

export async function GET(request: Request) {
    if (process.env.NODE_ENV === "production") {
        if (!verifyCronRequest(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        logger.info("Daily reminder preparation started", { action: "cron/task-reminders" });

        const today = new Date();
        const todayStr = format(today, "yyyy-MM-dd");
        const dayName = format(today, "EEE").toUpperCase();

        const usersSnapshot = await getDocs(collection(db, "users"));
        let usersProcessed = 0;
        let remindersScheduled = 0;

        for (const userDoc of usersSnapshot.docs) {
            try {
                const userId = userDoc.id;

                // Get user's tasks
                const tasksSnapshot = await getDocs(collection(db, "users", userId, "tasks"));
                const tasks: Task[] = tasksSnapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                } as Task));

                // Clear old scheduled reminders
                const oldRemindersSnapshot = await getDocs(
                    collection(db, "users", userId, "scheduledReminders")
                );
                for (const oldDoc of oldRemindersSnapshot.docs) {
                    await deleteDoc(doc(db, "users", userId, "scheduledReminders", oldDoc.id));
                }

                // Filter today's tasks with reminders
                const todaysTasks = tasks.filter(t =>
                    t.days?.includes(dayName) && t.reminder && t.startTime
                );

                // Schedule reminders for today
                const scheduledReminders: ScheduledReminder[] = [];

                for (const task of todaysTasks) {
                    const reminderMinutes = parseReminderToMinutes(task.reminder || "15m");

                    // Parse task start time and calculate reminder time
                    const [hours, minutes] = task.startTime.split(":").map(Number);
                    const taskStart = new Date(today);
                    taskStart.setHours(hours, minutes, 0, 0);

                    const reminderTime = addMinutes(taskStart, -reminderMinutes);

                    const reminder: ScheduledReminder = {
                        taskId: task.id,
                        taskTitle: task.title,
                        taskIcon: task.icon || "📝",
                        startTime: task.startTime,
                        reminderTime: format(reminderTime, "HH:mm"),
                        delivered: false,
                    };

                    // Save to Firestore for client to check
                    await setDoc(
                        doc(db, "users", userId, "scheduledReminders", `${todayStr}-${task.id}`),
                        {
                            ...reminder,
                            date: todayStr,
                            createdAt: new Date().toISOString(),
                        }
                    );

                    scheduledReminders.push(reminder);
                    remindersScheduled++;
                }

                usersProcessed++;
            } catch (userError) {
                logger.warn("Failed to prepare reminders for user", userError);
            }
        }

        logger.info(`Daily reminders prepared: ${remindersScheduled} for ${usersProcessed} users`, {
            action: "cron/task-reminders",
            metadata: { usersProcessed, remindersScheduled },
        });

        return NextResponse.json({
            success: true,
            usersProcessed,
            remindersScheduled,
            date: todayStr,
            timestamp: today.toISOString(),
        });
    } catch (error: any) {
        logger.error("Task reminder cron failed", error, { action: "cron/task-reminders" });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function parseReminderToMinutes(reminder: string): number {
    switch (reminder) {
        case "5m": return 5;
        case "15m": return 15;
        case "30m": return 30;
        case "1h": return 60;
        default: return 15;
    }
}

export const dynamic = "force-dynamic";
