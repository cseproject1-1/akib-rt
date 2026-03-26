"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { format, subMinutes, addMinutes, isAfter, isBefore } from "date-fns";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { safeNotification } from "@/lib/safeNotification";
import { safeStorage } from "@/lib/safeStorage";


export const NotificationManager: React.FC = () => {
    const { tasks } = useTask();
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const notifiedTasks = useRef<Set<string>>(new Set());
    const scheduledNotifications = useRef<Set<string>>(new Set());

    // Request notification permission on mount
    useEffect(() => {
        if (safeNotification.isAvailable() && safeNotification.permission === "default") {
            // Delay permission request to not interrupt initial experience
            const timeout = setTimeout(() => {
                safeNotification.requestPermission().then((permission) => {
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
        // Add to in-app notification center & show toast
        addNotification(title, body);

        if (!safeNotification.isGranted()) return;

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
            safeNotification.show(title, {
                body,
                icon: "/logo.jpg",
                tag
            });
        }
    }, [addNotification]);

    // Schedule upcoming task notifications
    useEffect(() => {
        if (!safeNotification.isGranted()) return;

        let notificationsEnabled = false;
        try {
            notificationsEnabled = safeStorage.getItem("rt_notifications_enabled") === "true";
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
            if (!safeNotification.isGranted()) return;
            // Check app-level preference
            let notificationsEnabled = false;
            try {
                notificationsEnabled = safeStorage.getItem("rt_notifications_enabled") === "true";
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

    // Check server-prepared scheduledReminders from Firestore (cron job prepares these daily)
    useEffect(() => {
        const checkServerReminders = async () => {
            if (!user) return;
            if (!safeNotification.isGranted()) return;

            let notificationsEnabled = false;
            try {
                notificationsEnabled = safeStorage.getItem("rt_notifications_enabled") === "true";
            } catch (e) { }
            if (!notificationsEnabled) return;

            try {
                const now = new Date();
                const currentTime = format(now, "HH:mm");

                const remindersSnapshot = await getDocs(
                    collection(db, "users", user.uid, "scheduledReminders")
                );

                for (const reminderDoc of remindersSnapshot.docs) {
                    const reminder = reminderDoc.data();

                    // Skip if already delivered
                    if (reminder.delivered) continue;

                    // Check if reminder time has passed
                    if (reminder.reminderTime <= currentTime && !notifiedTasks.current.has(reminderDoc.id)) {
                        showNotification(
                            `⏰ Upcoming: ${reminder.taskTitle}`,
                            `${reminder.taskIcon} Starting at ${reminder.startTime}`,
                            `reminder-${reminderDoc.id}`
                        );
                        notifiedTasks.current.add(reminderDoc.id);

                        // Mark as delivered in Firestore
                        await updateDoc(doc(db, "users", user.uid, "scheduledReminders", reminderDoc.id), {
                            delivered: true
                        });
                    }
                }
            } catch (error) {
                console.error("[Notifications] Failed to check server reminders:", error);
            }
        };

        // Check every minute for server-prepared reminders
        if (user) {
            const interval = setInterval(checkServerReminders, 60000);
            checkServerReminders(); // Initial check
            return () => clearInterval(interval);
        }
    }, [user, showNotification]);

    // Daily AI Motivation (online only)
    // Daily AI Motivation
    useEffect(() => {
        const sendDailyMotivation = async () => {
            if (!user) return;

            // Check app-level preference
            let notificationsEnabled = false;
            let lastMotivationDate = null;
            try {
                notificationsEnabled = safeStorage.getItem("rt_notifications_enabled") === "true";
                lastMotivationDate = safeStorage.getItem("lastMotivationDate");
            } catch (error) { }

            if (!notificationsEnabled) return;

            const today = format(new Date(), "yyyy-MM-dd");
            if (lastMotivationDate === today) return;

            // Offline Fallback Motivations
            const offlineMotivations = [
                "Consistency is key! unexpected journey starts with a single step.",
                "You are capable of amazing things. Keep pushing!",
                "Small progress is still progress. Keep going!",
                "Your potential is endless. Go do what you were created to do.",
                "Discipline is choosing between what you want now and what you want most."
            ];

            try {
                if (!navigator.onLine) {
                    const randomMsg = offlineMotivations[Math.floor(Math.random() * offlineMotivations.length)];
                    showNotification("Daily Motivation ✨", randomMsg, "daily-motivation");
                    safeStorage.setItem("lastMotivationDate", today);
                    return;
                }

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

                if (!response.ok) throw new Error("API Failed");

                const data = await response.json();

                if (data.motivation) {
                    showNotification("Daily Motivation ✨", data.motivation, "daily-motivation");
                    safeStorage.setItem("lastMotivationDate", today);
                }
            } catch (error) {
                console.error("Failed to get motivation:", error);
                // Fallback on error
                const randomMsg = offlineMotivations[Math.floor(Math.random() * offlineMotivations.length)];
                showNotification("Daily Motivation ✨", randomMsg, "daily-motivation");
                try {
                    safeStorage.setItem("lastMotivationDate", today);
                } catch (e) { }
            }
        };

        // Run after a short delay to ensure app is ready
        const timeout = setTimeout(sendDailyMotivation, 5000);
        return () => clearTimeout(timeout);
    }, [tasks, user, showNotification]);

    return null;
};
