"use client";

import React, { useState } from "react";
import { useAchievements, Achievement } from "@/context/AchievementsContext";
import { Lock, Check, Trophy, Star, Flame, Target, Zap, Award } from "lucide-react";
import { format } from "date-fns";

interface AchievementBadgeProps {
    achievement: Achievement;
    size?: "sm" | "md" | "lg";
    showTooltip?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
    achievement,
    size = "md",
    showTooltip = true,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const isUnlocked = !!achievement.unlockedAt;

    const sizeClasses = {
        sm: { container: "h-12 w-12", icon: "text-xl", ring: "ring-2" },
        md: { container: "h-16 w-16", icon: "text-3xl", ring: "ring-2" },
        lg: { container: "h-24 w-24", icon: "text-5xl", ring: "ring-4" },
    };

    const styles = sizeClasses[size];

    const categoryColors = {
        streak: "from-orange-500 to-red-500",
        completion: "from-purple-500 to-pink-500",
        milestone: "from-blue-500 to-cyan-500",
        special: "from-emerald-500 to-green-500",
    };

    return (
        <div
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Badge */}
            <div
                className={`
          ${styles.container} rounded-2xl flex items-center justify-center transition-all duration-300
          ${isUnlocked
                        ? `bg-gradient-to-br ${categoryColors[achievement.category]} shadow-lg shadow-purple-500/20 ring-white/20 ${styles.ring}`
                        : "bg-muted/50 ring-1 ring-white/5"
                    }
          ${isUnlocked ? "hover:scale-110 hover:shadow-xl" : "opacity-50 grayscale"}
        `}
            >
                {isUnlocked ? (
                    <span className={`${styles.icon} select-none`}>{achievement.icon}</span>
                ) : (
                    <Lock className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"} text-muted-foreground`} />
                )}

                {/* Unlocked Checkmark */}
                {isUnlocked && size !== "sm" && (
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-background">
                        <Check className="h-3 w-3 text-white" />
                    </div>
                )}
            </div>

            {/* Tooltip */}
            {showTooltip && isHovered && (
                <div className="absolute z-50 left-1/2 bottom-full mb-2 -translate-x-1/2 pointer-events-none">
                    <div className="bg-popover border border-border rounded-xl px-4 py-3 shadow-xl min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{achievement.icon}</span>
                            <div>
                                <h4 className="font-bold text-foreground text-sm">{achievement.name}</h4>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {achievement.category}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-400">+{achievement.xpReward} XP</span>
                            {isUnlocked && achievement.unlockedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                    Unlocked {format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Tooltip Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1">
                        <div className="border-8 border-transparent border-t-popover"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Achievement Grid Component
interface AchievementGridProps {
    category?: "all" | "streak" | "completion" | "milestone" | "special";
    showLocked?: boolean;
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({
    category = "all",
    showLocked = true,
}) => {
    const { achievements, unlockedAchievements, lockedAchievements } = useAchievements();

    const filteredAchievements = category === "all"
        ? achievements
        : achievements.filter(a => a.category === category);

    const unlockedFiltered = filteredAchievements.filter(a => a.unlockedAt);
    const lockedFiltered = filteredAchievements.filter(a => !a.unlockedAt);

    return (
        <div className="space-y-6">
            {/* Unlocked */}
            {unlockedFiltered.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        Unlocked ({unlockedFiltered.length})
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {unlockedFiltered.map(achievement => (
                            <AchievementBadge key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                </div>
            )}

            {/* Locked */}
            {showLocked && lockedFiltered.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Locked ({lockedFiltered.length})
                    </h4>
                    <div className="flex flex-wrap gap-3">
                        {lockedFiltered.map(achievement => (
                            <AchievementBadge key={achievement.id} achievement={achievement} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Achievement Unlock Toast
interface AchievementUnlockToastProps {
    achievement: Achievement;
    onDismiss: () => void;
}

export const AchievementUnlockToast: React.FC<AchievementUnlockToastProps> = ({
    achievement,
    onDismiss,
}) => {
    return (
        <div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500"
            onClick={onDismiss}
        >
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-1 shadow-2xl shadow-purple-500/30">
                <div className="bg-background/95 backdrop-blur-xl rounded-xl px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-background transition-colors">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl animate-bounce">
                        {achievement.icon}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">
                            🎉 Achievement Unlocked!
                        </p>
                        <h3 className="font-bold text-foreground text-lg">{achievement.name}</h3>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                    <div className="text-right ml-4">
                        <span className="text-lg font-black text-yellow-400">+{achievement.xpReward}</span>
                        <span className="text-xs text-muted-foreground block">XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
