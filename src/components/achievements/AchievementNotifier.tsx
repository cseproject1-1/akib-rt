"use client";

import React, { useEffect } from "react";
import { useAchievements } from "@/context/AchievementsContext";
import { AchievementUnlockToast } from "@/components/achievements/AchievementBadge";

export const AchievementNotifier: React.FC = () => {
    const { recentUnlock, clearRecentUnlock } = useAchievements();

    // Auto-dismiss after 5 seconds
    useEffect(() => {
        if (recentUnlock) {
            const timer = setTimeout(() => {
                clearRecentUnlock();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [recentUnlock, clearRecentUnlock]);

    if (!recentUnlock) return null;

    return (
        <AchievementUnlockToast
            achievement={recentUnlock}
            onDismiss={clearRecentUnlock}
        />
    );
};
