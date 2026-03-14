"use client";

import React from "react";
import { Zap, TrendingUp, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface EnergyPattern {
    hour: number;
    averageFocusPercentage: number;
    sessionCount: number;
    totalMinutes: number;
    energyLevel: "high" | "medium" | "low";
}

interface FocusEnergyMeterProps {
    patterns: EnergyPattern[];
    currentHour: number;
}

export const FocusEnergyMeter: React.FC<FocusEnergyMeterProps> = ({
    patterns,
    currentHour,
}) => {
    const currentPattern = patterns.find((p) => p.hour === currentHour);

    // Find peak hours
    const peakHours = patterns
        .filter((p) => p.energyLevel === "high" && p.sessionCount >= 3)
        .sort((a, b) => b.averageFocusPercentage - a.averageFocusPercentage)
        .slice(0, 3);

    const formatHour = (hour: number) => {
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour} ${ampm}`;
    };

    const getEnergyColor = (level: "high" | "medium" | "low") => {
        switch (level) {
            case "high":
                return "from-emerald-500 to-teal-500";
            case "medium":
                return "from-yellow-500 to-orange-500";
            case "low":
                return "from-red-500 to-pink-500";
        }
    };

    const getEnergyEmoji = (level: "high" | "medium" | "low") => {
        switch (level) {
            case "high":
                return "⚡";
            case "medium":
                return "💡";
            case "low":
                return "🌙";
        }
    };

    const getEnergyMessage = (level: "high" | "medium" | "low") => {
        switch (level) {
            case "high":
                return "Your energy is HIGH now. Perfect for deep work!";
            case "medium":
                return "Moderate energy. Good for routine tasks.";
            case "low":
                return "Lower energy period. Consider a break or lighter work.";
        }
    };

    // If not enough data
    if (patterns.every((p) => p.sessionCount === 0)) {
        return (
            <div className="rounded-3xl bg-card border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Energy Meter</h3>
                        <p className="text-xs text-muted-foreground">
                            AI-powered focus insights
                        </p>
                    </div>
                </div>

                <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-2">
                        Complete more focus sessions to unlock energy insights
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        We'll analyze your patterns after 10+ sessions
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-card border border-border p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">Energy Meter</h3>
                    <p className="text-xs text-muted-foreground">
                        AI-powered focus insights
                    </p>
                </div>
            </div>

            {/* Current Energy */}
            {currentPattern && currentPattern.sessionCount > 0 && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${getEnergyColor(
                        currentPattern.energyLevel
                    )}/10 border border-${getEnergyColor(currentPattern.energyLevel)}/20`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">
                            {getEnergyEmoji(currentPattern.energyLevel)}
                        </span>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">
                                Right Now ({formatHour(currentHour)})
                            </p>
                            <p className="text-lg font-black text-foreground">
                                {currentPattern.energyLevel.toUpperCase()} Energy
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-foreground/90 font-medium">
                        {getEnergyMessage(currentPattern.energyLevel)}
                    </p>

                    {currentPattern.averageFocusPercentage > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${currentPattern.averageFocusPercentage}%`,
                                    }}
                                    transition={{ duration: 1 }}
                                    className={`h-full bg-gradient-to-r ${getEnergyColor(
                                        currentPattern.energyLevel
                                    )} rounded-full`}
                                />
                            </div>
                            <span className="text-xs font-bold text-foreground">
                                {currentPattern.averageFocusPercentage}%
                            </span>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Peak Hours */}
            {peakHours.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Your Peak Hours
                        </h4>
                    </div>

                    <div className="space-y-2">
                        {peakHours.map((peak, i) => (
                            <motion.div
                                key={peak.hour}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                                <div className="flex items-center gap-2 flex-1">
                                    <Clock className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm font-bold text-foreground">
                                        {formatHour(peak.hour)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {peak.averageFocusPercentage}% focus
                                    </span>
                                    <span className="text-xs text-muted-foreground/70">
                                        • {peak.sessionCount} sessions
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                        💡 Schedule important work during these times for best results
                    </p>
                </div>
            )}

            {/* Mini Chart */}
            <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    24-Hour Pattern
                </h4>
                <div className="flex items-end justify-between gap-1 h-16">
                    {patterns
                        .filter((p) => p.sessionCount > 0)
                        .map((pattern) => {
                            const height =
                                pattern.sessionCount > 0
                                    ? (pattern.averageFocusPercentage / 100) * 100
                                    : 5;
                            const isCurrentHour = pattern.hour === currentHour;

                            return (
                                <div
                                    key={pattern.hour}
                                    className="flex-1 flex flex-col items-center gap-1 group relative"
                                >
                                    <div
                                        className={`w-full rounded-t transition-all ${isCurrentHour
                                                ? "bg-gradient-to-t from-emerald-500 to-teal-500 ring-2 ring-emerald-500/50"
                                                : pattern.energyLevel === "high"
                                                    ? "bg-emerald-500/40"
                                                    : pattern.energyLevel === "medium"
                                                        ? "bg-yellow-500/40"
                                                        : "bg-red-500/40"
                                            }`}
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                                        <div className="bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                            {formatHour(pattern.hour)}:{" "}
                                            {pattern.averageFocusPercentage}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>12 AM</span>
                    <span>12 PM</span>
                    <span>11 PM</span>
                </div>
            </div>
        </div>
    );
};
