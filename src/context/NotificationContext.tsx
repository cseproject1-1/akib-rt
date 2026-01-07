"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    type?: "info" | "success" | "warning" | "error";
    link?: string;
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

    // Load from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("rt_notifications_history");
            if (stored) {
                setNotifications(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load notifications", e);
        }
    }, []);

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

    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

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
