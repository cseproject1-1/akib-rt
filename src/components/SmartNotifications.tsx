"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTask, Task } from "@/context/TaskContext";
import { useAnalytics } from "@/context/AnalyticsContext";
import { useNotification } from "@/context/NotificationContext";
import { format, addHours, isBefore, isAfter, subHours, differenceInMinutes } from "date-fns";
import { Bell, BellRing, Flame, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";

interface SmartReminder {
    id: string;
    type: "streak_warning" | "goal_deadline" | "task_reminder" | "daily_summary";
    title: string;
    message: string;
    icon: React.ReactNode;
    priority: "low" | "medium" | "high";
    dismissedAt?: string;
}

export const SmartNotifications: React.FC = () => {
    const { tasks } = useTask();
    const { currentStreak, productivityScore } = useAnalytics();
    const [reminders, setReminders] = useState<SmartReminder[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    // Get today's tasks
    const todayTasks = useMemo(() => {
        const today = format(new Date(), "EEE").toUpperCase();
        return tasks.filter((t: Task) => t.days.includes(today));
    }, [tasks]);

    // Check for streak break risk
    const checkStreakRisk = useCallback(() => {
        const today = format(new Date(), "yyyy-MM-dd");
        const completedToday = todayTasks.filter((t: Task) => t.completionHistory.includes(today));

        // If we have a streak and no tasks completed today after 6pm
        const now = new Date();
        const isEvening = now.getHours() >= 18;

        if (currentStreak > 0 && completedToday.length === 0 && isEvening && todayTasks.length > 0) {
            return {
                id: `streak-warning-${today}`,
                type: "streak_warning" as const,
                title: "🔥 Streak at Risk!",
                message: `You have a ${currentStreak}-day streak! Complete at least 1 task before midnight to keep it going.`,
                icon: <Flame className="h-5 w-5 text-orange-400" />,
                priority: "high" as const
            };
        }
        return null;
    }, [currentStreak, todayTasks]);

    // Check for pending tasks
    const checkPendingTasks = useCallback(() => {
        const today = format(new Date(), "yyyy-MM-dd");
        const pendingTasks = todayTasks.filter((t: Task) => !t.completionHistory.includes(today));

        if (pendingTasks.length > 3) {
            return {
                id: `pending-tasks-${today}`,
                type: "task_reminder" as const,
                title: "📋 Tasks Pending",
                message: `You have ${pendingTasks.length} tasks remaining today. Stay on track!`,
                icon: <Clock className="h-5 w-5 text-blue-400" />,
                priority: "medium" as const
            };
        }
        return null;
    }, [todayTasks]);

    // Check productivity decline
    const checkProductivityDecline = useCallback(() => {
        const today = format(new Date(), "yyyy-MM-dd");

        if (productivityScore < 40) {
            return {
                id: `productivity-low-${today}`,
                type: "daily_summary" as const,
                title: "📉 Productivity Dip",
                message: "Your productivity score is below 40. Consider focusing on high-priority tasks today.",
                icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
                priority: "low" as const
            };
        }
        return null;
    }, [productivityScore]);

    // Generate daily motivation if doing well
    const checkPositiveFeedback = useCallback(() => {
        const today = format(new Date(), "yyyy-MM-dd");

        if (currentStreak >= 7 && productivityScore >= 70) {
            return {
                id: `positive-feedback-${today}`,
                type: "daily_summary" as const,
                title: "⭐ You're Crushing It!",
                message: `${currentStreak}-day streak with ${productivityScore}% productivity. Keep up the amazing work!`,
                icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
                priority: "low" as const
            };
        }
        return null;
    }, [currentStreak, productivityScore]);

    // Update reminders periodically
    useEffect(() => {
        const generateReminders = () => {
            const newReminders: SmartReminder[] = [];

            const streakWarning = checkStreakRisk();
            if (streakWarning && !dismissedIds.has(streakWarning.id)) {
                newReminders.push(streakWarning);
            }

            const pendingTasks = checkPendingTasks();
            if (pendingTasks && !dismissedIds.has(pendingTasks.id)) {
                newReminders.push(pendingTasks);
            }

            const productivityWarning = checkProductivityDecline();
            if (productivityWarning && !dismissedIds.has(productivityWarning.id)) {
                newReminders.push(productivityWarning);
            }

            const positiveFeedback = checkPositiveFeedback();
            if (positiveFeedback && !dismissedIds.has(positiveFeedback.id)) {
                newReminders.push(positiveFeedback);
            }

            setReminders(newReminders);
        };

        generateReminders();

        // Check every 30 minutes
        const interval = setInterval(generateReminders, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [checkStreakRisk, checkPendingTasks, checkProductivityDecline, checkPositiveFeedback, dismissedIds]);

    const dismissReminder = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
    };

    if (reminders.length === 0) return null;

    return (
        <div className="space-y-3">
            {reminders.map((reminder) => (
                <div
                    key={reminder.id}
                    className={`relative p-4 rounded-2xl border ${reminder.priority === "high"
                        ? "bg-orange-500/10 border-orange-500/30"
                        : reminder.priority === "medium"
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-white/5 border-white/10"
                        } transition-all hover:scale-[1.01]`}
                >
                    <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${reminder.priority === "high"
                            ? "bg-orange-500/20"
                            : reminder.priority === "medium"
                                ? "bg-blue-500/20"
                                : "bg-white/10"
                            }`}>
                            {reminder.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground text-sm">{reminder.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{reminder.message}</p>
                        </div>

                        <button
                            onClick={() => dismissReminder(reminder.id)}
                            className="h-6 w-6 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors shrink-0"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
