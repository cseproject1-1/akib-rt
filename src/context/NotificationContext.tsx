"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    type?: "info" | "success" | "warning" | "error";
    link?: string;
    source?: "local" | "server"; // Track notification source
}

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    addNotification: (title: string, message: string, type?: AppNotification["type"], link?: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("rt_notifications_history");
            if (stored) {
                const localNotifications = JSON.parse(stored).map((n: AppNotification) => ({
                    ...n,
                    source: "local" as const
                }));
                setNotifications(localNotifications);
            }
        } catch (e) {
            console.error("Failed to load notifications", e);
        }
    }, []);

    // Sync server notifications from Firestore
    useEffect(() => {
        if (!user) return;

        const notificationsRef = collection(db, "users", user.uid, "notifications");
        const q = query(notificationsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const serverNotifications: AppNotification[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                serverNotifications.push({
                    id: doc.id,
                    title: data.title,
                    message: data.message,
                    timestamp: new Date(data.createdAt).getTime(),
                    read: data.read || false,
                    type: data.type || "info",
                    source: "server"
                });
            });

            // Merge server notifications with local ones
            setNotifications((prev) => {
                const localNotifications = prev.filter(n => n.source === "local");
                const merged = [...serverNotifications, ...localNotifications];
                // Sort by timestamp descending
                return merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
            });
        });

        return () => unsubscribe();
    }, [user]);

    // Update unread count and persist whenever notifications change
    useEffect(() => {
        setUnreadCount(notifications.filter((n) => !n.read).length);
        try {
            localStorage.setItem("rt_notifications_history", JSON.stringify(notifications.slice(0, 50))); // Limit to 50
        } catch (e) {
            console.error("Failed to save notifications", e);
        }
    }, [notifications]);

    const playSound = useCallback(() => {
        try {
            // Simple "ding" sound using Web Audio API to avoid assets
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop to A4

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);

            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            // Audio context might be blocked if no user interaction, ignore
        }
    }, []);

    const addNotification = useCallback((title: string, message: string, type: AppNotification["type"] = "info", link?: string) => {
        const newNotification: AppNotification = {
            id: uuidv4(),
            title,
            message,
            timestamp: Date.now(),
            read: false,
            type,
            link,
            source: "local",
        };

        setNotifications((prev) => [newNotification, ...prev]);

        // Play sound
        playSound();

        // Show Toast
        toast(title, {
            description: message,
            action: link ? {
                label: "View",
                onClick: () => window.location.href = link,
            } : undefined,
        });
    }, [playSound]);

    const markAsRead = useCallback(async (id: string) => {
        const notification = notifications.find(n => n.id === id);

        // Update Firestore if it's a server notification
        if (notification?.source === "server" && user) {
            try {
                await updateDoc(doc(db, "users", user.uid, "notifications", id), {
                    read: true
                });
            } catch (error) {
                console.error("Failed to mark notification as read in Firestore", error);
            }
        }

        // Update local state
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, [notifications, user]);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback(async (id: string) => {
        const notification = notifications.find(n => n.id === id);

        // Delete from Firestore if it's a server notification
        if (notification?.source === "server" && user) {
            try {
                await deleteDoc(doc(db, "users", user.uid, "notifications", id));
            } catch (error) {
                console.error("Failed to delete notification from Firestore", error);
            }
        }

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, [notifications, user]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                removeNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};
