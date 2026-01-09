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
            className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 ${!isOnline
                    ? "bg-amber-500/90 text-white"
                    : isSyncing
                        ? "bg-blue-500/90 text-white"
                        : pendingCount > 0
                            ? "bg-orange-500/90 text-white"
                            : "bg-green-500/90 text-white"
                } ${className}`}
        >
            {!isOnline ? (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span>Offline</span>
                    {pendingCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                            {pendingCount} pending
                        </span>
                    )}
                </>
            ) : isSyncing ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                </>
            ) : pendingCount > 0 ? (
                <>
                    <CloudOff className="w-4 h-4" />
                    <span>{pendingCount} pending</span>
                </>
            ) : (
                <>
                    <Cloud className="w-4 h-4" />
                    <span>Synced</span>
                </>
            )}
        </div>
    );
};

export default OfflineIndicator;
