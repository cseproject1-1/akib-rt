"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { format, subMinutes, addMinutes, isAfter, isBefore } from "date-fns";

export const NotificationManager: React.FC = () => {
    const { tasks } = useTask();
    const { user } = useAuth();
    const notifiedTasks = useRef<Set<string>>(new Set());
    const scheduledNotifications = useRef<Set<string>>(new Set());

    // Request notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            // Delay permission request to not interrupt initial experience
            const timeout = setTimeout(() => {
                Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                        console.log("[Notifications] Permission granted");
                    }
                });
            }, 10000);
            return () => clearTimeout(timeout);
        }
    }, []);

    // Schedule notification via Service Worker
    const scheduleNotification = useCallback((title: string, body: string, scheduledTime: number, tag: string) => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({
                type: "SCHEDULE_NOTIFICATION",
                title,
                body,
                scheduledTime,
                tag
            });
            console.log(`[Notifications] Scheduled: ${title} at ${new Date(scheduledTime).toLocaleTimeString()}`);
        });
    }, []);

    // Show immediate notification (fallback for when SW not available)
    const showNotification = useCallback((title: string, body: string, tag: string) => {
        if (Notification.permission !== "granted") return;

        // Try service worker first (for offline support)
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body,
                    icon: "/logo.jpg",
                    badge: "/icon-192.png",
                    tag,
                    requireInteraction: false
                });
            });
        } else {
            // Fallback to regular notification
            new Notification(title, {
                body,
                icon: "/logo.jpg",
                tag
            });
        }
    }, []);

    // Schedule upcoming task notifications
    useEffect(() => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;

        let notificationsEnabled = false;
        try {
            notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
        } catch (e) { }

        if (!notificationsEnabled) return;
        if (tasks.length === 0) return;

        const now = new Date();
        const todayStr = format(now, "EEE").toUpperCase();
        const todayDateStr = format(now, "yyyy-MM-dd");

        tasks.forEach(task => {
            // Skip if not scheduled for today or already completed
            const isCompletedToday = task.completionHistory?.includes(todayDateStr);
            if (!task.days.includes(todayStr) || isCompletedToday) return;

            // Parse start time
            const [hours, mins] = task.startTime.split(":").map(Number);
            const taskStartTime = new Date(now);
            taskStartTime.setHours(hours, mins, 0, 0);

            // Skip if task time has passed
            if (isBefore(taskStartTime, now)) return;

            // Schedule reminder notification
            if (task.reminder) {
                let reminderMinutes = 0;
                if (task.reminder.endsWith("m")) reminderMinutes = parseInt(task.reminder);
                else if (task.reminder.endsWith("h")) reminderMinutes = parseInt(task.reminder) * 60;

                const reminderTime = subMinutes(taskStartTime, reminderMinutes);
                const reminderId = `${task.id}-reminder-${todayDateStr}`;

                if (isAfter(reminderTime, now) && !scheduledNotifications.current.has(reminderId)) {
                    scheduleNotification(
                        `⏰ Upcoming: ${task.title}`,
                        `Starting in ${task.reminder} at ${task.startTime}`,
                        reminderTime.getTime(),
                        reminderId
                    );
                    scheduledNotifications.current.add(reminderId);
                }
            }

            // Schedule start time notification
            const startId = `${task.id}-start-${todayDateStr}`;
            if (!scheduledNotifications.current.has(startId)) {
                scheduleNotification(
                    `🎯 Time for ${task.title}!`,
                    `Your ${task.timeBlock} task is starting now.`,
                    taskStartTime.getTime(),
                    startId
                );
                scheduledNotifications.current.add(startId);
            }
        });
    }, [tasks, scheduleNotification]);

    // Check for missed notifications (real-time fallback)
    useEffect(() => {
        const checkTasks = () => {
            if (Notification.permission !== "granted") return;
            // Check app-level preference
            let notificationsEnabled = false;
            try {
                notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
            } catch (error) {
                // If localStorage is blocked, assume disabled or handle gracefully
            }
            if (!notificationsEnabled) return;

            const now = new Date();
            const todayStr = format(now, "EEE").toUpperCase();
            const todayDateStr = format(now, "yyyy-MM-dd");

            tasks.forEach(task => {
                const isCompletedToday = task.completionHistory?.includes(todayDateStr);
                if (!task.days.includes(todayStr) || isCompletedToday) return;

                const [hours, mins] = task.startTime.split(":").map(Number);
                const taskStartTime = new Date(now);
                taskStartTime.setHours(hours, mins, 0, 0);

                // Check for start time notification (within 2 minute window)
                const startId = `${task.id}-start-${todayDateStr}`;
                if (isAfter(now, taskStartTime) && isBefore(now, addMinutes(taskStartTime, 2)) && !notifiedTasks.current.has(startId)) {
                    showNotification(`🎯 Time for ${task.title}!`, `Your ${task.timeBlock} task is starting now.`, startId);
                    notifiedTasks.current.add(startId);
                }
            });
        };

        // Check every 30 seconds for more responsive notifications
        const interval = setInterval(checkTasks, 30000);
        checkTasks(); // Initial check
        return () => clearInterval(interval);
    }, [tasks, showNotification]);

    // Daily AI Motivation (online only)
    useEffect(() => {
        const sendDailyMotivation = async () => {
            if (Notification.permission !== "granted" || !user) return;

            // Check app-level preference
            let notificationsEnabled = false;
            let lastMotivationDate = null;
            try {
                notificationsEnabled = localStorage.getItem("rt_notifications_enabled") === "true";
                lastMotivationDate = localStorage.getItem("lastMotivationDate");
            } catch (error) {
                // Ignore storage errors
            }

            if (!notificationsEnabled) return;

            const today = format(new Date(), "yyyy-MM-dd");
            if (lastMotivationDate === today) return;

            try {
                const todayStr = format(new Date(), "EEE").toUpperCase();
                const todayTasks = tasks.filter(t => t.days?.includes(todayStr));

                const response = await fetch("/api/ai/motivation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tasks: todayTasks.slice(0, 5),
                        userName: user.displayName || user.email?.split("@")[0],
                    }),
                });

                const data = await response.json();

                if (data.motivation) {
                    showNotification("Daily Motivation ✨", data.motivation, "daily-motivation");
                    try {
                        localStorage.setItem("lastMotivationDate", today);
                    } catch (e) { }
                }
            } catch (error) {
                console.error("Failed to get motivation:", error);
            }
        };

        const timeout = setTimeout(sendDailyMotivation, 8000);
        return () => clearTimeout(timeout);
    }, [tasks, user, showNotification]);

    return null;
};
