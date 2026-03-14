"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, Trash2, Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { useNotification, AppNotification } from "@/context/NotificationContext";
import { format } from "date-fns";
import { Button } from "./ui/Button";

export const NotificationCenter: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getIcon = (type: AppNotification["type"]) => {
        switch (type) {
            case "success": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case "error": return <AlertCircle className="h-5 w-5 text-red-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
                <Bell className={`h-6 w-6 transition-transform ${isOpen ? "rotate-12" : ""}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                )}
            </Button>

            {isOpen && (
                <div className="fixed inset-x-4 top-24 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 w-auto md:w-96 rounded-3xl border border-border bg-background/95 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top md:origin-top-right">
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-500">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                    title="Mark all as read"
                                >
                                    <Check className="h-4 w-4 mr-1" /> Mark all
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearAll}
                                    className="h-8 text-xs text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                    title="Clear all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                <p className="text-sm font-medium text-foreground">No notifications</p>
                                <p className="text-xs text-muted-foreground">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/30">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`group relative flex gap-4 p-4 transition-colors hover:bg-muted/40 ${!notification.read ? "bg-purple-500/5 hover:bg-purple-500/10" : ""}`}
                                    >
                                        <div className="mt-1 shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium leading-none ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {format(notification.timestamp, "h:mm a")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-[10px] font-medium text-purple-500 hover:underline"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeNotification(notification.id)}
                                                    className="text-[10px] font-medium text-red-500 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-purple-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
