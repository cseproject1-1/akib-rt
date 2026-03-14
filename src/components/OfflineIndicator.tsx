"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Cloud, CloudOff, Loader2 } from "lucide-react";
import { getPendingCount, hasPendingOperations } from "@/lib/offlineQueue";

interface OfflineIndicatorProps {
    className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = "" }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Initial state
        setIsOnline(navigator.onLine);
        setPendingCount(getPendingCount());

        const handleOnline = () => {
            setIsOnline(true);
            setIsSyncing(true);
            // Syncing animation for 2 seconds
            setTimeout(() => {
                setIsSyncing(false);
                setPendingCount(getPendingCount());
            }, 2000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setIsSyncing(false);
        };

        // Update pending count periodically
        const interval = setInterval(() => {
            setPendingCount(getPendingCount());
        }, 1000);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            clearInterval(interval);
        };
    }, []);

    // Don't show if online with no pending operations
    if (isOnline && pendingCount === 0 && !isSyncing) {
        return null;
    }

    return (
        <div
            className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg transition-all duration-300 backdrop-blur-md ${!isOnline
                ? "bg-gradient-to-r from-blue-500/90 to-purple-500/90 text-white border border-blue-400/30"
                : isSyncing
                    ? "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border border-green-400/30 shadow-green-500/20"
                    : pendingCount > 0
                        ? "bg-gradient-to-r from-orange-500/90 to-amber-500/90 text-white border border-orange-400/30"
                        : "bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white border border-green-400/30"
                } ${className}`}
        >
            {!isOnline ? (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span className="font-semibold">Working Offline</span>
                    {pendingCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                            {pendingCount} queued
                        </span>
                    )}
                </>
            ) : isSyncing ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-semibold">Syncing data...</span>
                </>
            ) : pendingCount > 0 ? (
                <>
                    <CloudOff className="w-4 h-4" />
                    <span className="font-semibold">{pendingCount} pending</span>
                </>
            ) : (
                <>
                    <Cloud className="w-4 h-4" />
                    <span className="font-semibold">All synced</span>
                </>
            )}
        </div>
    );
};

export default OfflineIndicator;
