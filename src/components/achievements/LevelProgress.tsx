"use client";

import React from "react";
import { useAchievements } from "@/context/AchievementsContext";
import { Star, Zap, TrendingUp, Crown } from "lucide-react";

interface LevelProgressProps {
    variant?: "compact" | "full";
    showXPDetails?: boolean;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({
    variant = "full",
    showXPDetails = true,
}) => {
    const { level, currentXP, xpToNextLevel, totalXP, levelName } = useAchievements();

    const xpForCurrentLevel = level < 20 ? currentXP : totalXP;
    const xpNeeded = level < 20 ? currentXP + xpToNextLevel : totalXP;
    const progressPercent = level >= 20 ? 100 : Math.round((currentXP / (currentXP + xpToNextLevel)) * 100);

    const getLevelColor = (lvl: number) => {
        if (lvl >= 16) return "from-amber-300 to-yellow-500"; // Diamond
        if (lvl >= 12) return "from-purple-400 to-pink-500"; // Platinum
        if (lvl >= 8) return "from-yellow-400 to-orange-500"; // Gold
        if (lvl >= 4) return "from-gray-300 to-gray-400"; // Silver
        return "from-orange-600 to-amber-700"; // Bronze
    };

    const getLevelTier = (lvl: number) => {
        if (lvl >= 16) return "Diamond";
        if (lvl >= 12) return "Platinum";
        if (lvl >= 8) return "Gold";
        if (lvl >= 4) return "Silver";
        return "Bronze";
    };

    const tierColors = {
        Bronze: "text-orange-400",
        Silver: "text-gray-300",
        Gold: "text-yellow-400",
        Platinum: "text-purple-400",
        Diamond: "text-cyan-300",
    };

    const tier = getLevelTier(level);

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-3">
                {/* Level Badge */}
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center shadow-lg`}>
                    <span className="text-sm font-black text-white drop-shadow-md">{level}</span>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{levelName}</span>
                        <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${getLevelColor(level)} transition-all duration-500`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-card border border-border p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gradient-to-br ${getLevelColor(level)} opacity-10 blur-3xl`} />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Level Badge */}
                        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center shadow-xl shadow-purple-500/20`}>
                            <span className="text-2xl font-black text-white drop-shadow-lg">{level}</span>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-foreground">{levelName}</h3>
                                {level >= 8 && <Crown className="h-4 w-4 text-yellow-400" />}
                            </div>
                            <p className={`text-sm font-bold ${tierColors[tier as keyof typeof tierColors]}`}>
                                {tier} Tier
                            </p>
                        </div>
                    </div>

                    {/* Total XP */}
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            <Zap className="h-4 w-4 text-yellow-400" />
                            <span className="text-2xl font-black text-foreground">{totalXP.toLocaleString()}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Total XP</span>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Progress to Level {level < 20 ? level + 1 : "MAX"}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                            {level < 20 ? `${xpForCurrentLevel} / ${xpNeeded} XP` : "MAX LEVEL"}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 rounded-full bg-white/10 overflow-hidden relative">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${getLevelColor(level)} transition-all duration-700 relative`}
                            style={{ width: `${progressPercent}%` }}
                        >
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </div>
                    </div>

                    {showXPDetails && level < 20 && (
                        <p className="text-xs text-muted-foreground text-center">
                            <span className="text-purple-400 font-bold">{xpToNextLevel.toLocaleString()} XP</span> to next level
                        </p>
                    )}
                </div>

                {/* Level Milestones */}
                <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                        Level Tiers
                    </h4>
                    <div className="flex items-center justify-between">
                        {["Bronze", "Silver", "Gold", "Platinum", "Diamond"].map((tierName, i) => {
                            const tierLevel = (i + 1) * 4;
                            const isReached = level >= tierLevel;
                            const isCurrent = tier === tierName;

                            return (
                                <div key={tierName} className="flex flex-col items-center">
                                    <div className={`
                    h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                    ${isReached
                                            ? `bg-gradient-to-br ${getLevelColor(tierLevel)} text-white shadow-lg`
                                            : "bg-muted text-muted-foreground"
                                        }
                    ${isCurrent ? "ring-2 ring-white/50 scale-110" : ""}
                  `}>
                                        {tierLevel}
                                    </div>
                                    <span className={`text-[10px] mt-1 font-medium ${isCurrent ? tierColors[tierName as keyof typeof tierColors] : "text-muted-foreground"}`}>
                                        {tierName}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mini Level Badge (for header/sidebar)
export const LevelBadge: React.FC<{ size?: "sm" | "md" }> = ({ size = "sm" }) => {
    const { level, levelName, totalXP } = useAchievements();

    const getLevelColor = (lvl: number) => {
        if (lvl >= 16) return "from-amber-300 to-yellow-500";
        if (lvl >= 12) return "from-purple-400 to-pink-500";
        if (lvl >= 8) return "from-yellow-400 to-orange-500";
        if (lvl >= 4) return "from-gray-300 to-gray-400";
        return "from-orange-600 to-amber-700";
    };

    const sizeClasses = size === "sm"
        ? "h-7 px-2 text-[10px]"
        : "h-9 px-3 text-xs";

    return (
        <div className={`${sizeClasses} rounded-full bg-gradient-to-r ${getLevelColor(level)} flex items-center gap-1.5 font-bold text-white shadow-lg`}>
            <Star className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
            <span>Lv.{level}</span>
        </div>
    );
};
