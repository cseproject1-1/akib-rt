"use client";

import React from "react";
import { useAnalytics } from "@/context/AnalyticsContext";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";

interface ProductivityScoreProps {
    size?: "sm" | "md" | "lg";
    showDetails?: boolean;
}

export const ProductivityScore: React.FC<ProductivityScoreProps> = ({
    size = "md",
    showDetails = true,
}) => {
    const { productivityScore, productivityTrend, currentStreak, averageCompletionRate } = useAnalytics();

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-400";
        if (score >= 60) return "text-green-400";
        if (score >= 40) return "text-yellow-400";
        if (score >= 20) return "text-orange-400";
        return "text-red-400";
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return "from-emerald-500 to-green-500";
        if (score >= 60) return "from-green-500 to-lime-500";
        if (score >= 40) return "from-yellow-500 to-orange-500";
        if (score >= 20) return "from-orange-500 to-red-500";
        return "from-red-500 to-rose-500";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return "Exceptional";
        if (score >= 80) return "Excellent";
        if (score >= 70) return "Great";
        if (score >= 60) return "Good";
        if (score >= 50) return "Average";
        if (score >= 40) return "Needs Work";
        if (score >= 20) return "Low";
        return "Getting Started";
    };

    const TrendIcon = productivityTrend === "up" ? TrendingUp :
        productivityTrend === "down" ? TrendingDown : Minus;

    const trendColor = productivityTrend === "up" ? "text-emerald-400" :
        productivityTrend === "down" ? "text-red-400" : "text-muted-foreground";

    const trendLabel = productivityTrend === "up" ? "Improving" :
        productivityTrend === "down" ? "Declining" : "Stable";

    const sizeClasses = {
        sm: { container: "p-4", score: "text-4xl", ring: "h-24 w-24" },
        md: { container: "p-6", score: "text-6xl", ring: "h-36 w-36" },
        lg: { container: "p-8", score: "text-7xl", ring: "h-48 w-48" },
    };

    const styles = sizeClasses[size];

    return (
        <div className={`rounded-3xl bg-card border border-border ${styles.container}`}>
            <div className="flex flex-col items-center text-center">
                {/* Score Ring */}
                <div className="relative mb-4">
                    <div className={`${styles.ring} rounded-full relative`}>
                        {/* Background Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-muted/20"
                            />
                            {/* Progress Ring */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${productivityScore * 2.83} 283`}
                                className="transition-all duration-1000"
                            />
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" className={`text-purple-500`} stopColor="currentColor" />
                                    <stop offset="100%" className={`text-pink-500`} stopColor="currentColor" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Score Value */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`font-black ${styles.score} ${getScoreColor(productivityScore)} tracking-tighter`}>
                                {productivityScore}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Score Label */}
                <div className="mb-4">
                    <h4 className="text-lg font-bold text-foreground">{getScoreLabel(productivityScore)}</h4>
                    <p className="text-xs text-muted-foreground">Productivity Score</p>
                </div>

                {/* Trend Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ${trendColor}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-xs font-bold">{trendLabel}</span>
                </div>

                {/* Detail Stats */}
                {showDetails && (
                    <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                        <div className="p-3 rounded-2xl bg-white/5">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Zap className="h-4 w-4 text-yellow-400" />
                                <span className="text-lg font-bold text-foreground">{currentStreak}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Day Streak</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/5">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-lg font-bold text-foreground">{averageCompletionRate}%</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">30-Day Avg</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
