"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, Brain, X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface SessionReportProps {
    isOpen: boolean;
    onClose: () => void;
    sessionData: {
        duration: number;
        taskTitle?: string;
        focusPercentage: number;
        previousAverage: number;
        isPerfectFocus: boolean;
        distractionCount: number;
        totalDistractTime: number;
    };
    onReview?: () => void;
}

export const SessionReport: React.FC<SessionReportProps> = ({
    isOpen,
    onClose,
    sessionData,
    onReview,
}) => {
    const {
        duration,
        taskTitle,
        focusPercentage,
        previousAverage,
        isPerfectFocus,
        distractionCount,
        totalDistractTime,
    } = sessionData;

    const improvement = focusPercentage - previousAverage;
    const isImproved = improvement > 0;

    React.useEffect(() => {
        if (isOpen && isPerfectFocus) {
            // Celebrate perfect focus!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [isOpen, isPerfectFocus]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-md rounded-3xl bg-card border border-border p-8 shadow-2xl relative"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    {isPerfectFocus ? (
                        <>
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-3xl mx-auto mb-3 animate-bounce">
                                ⭐
                            </div>
                            <h2 className="text-2xl font-black text-foreground mb-1">
                                Perfect Focus! 🎉
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Zero distractions detected
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mx-auto mb-3">
                                <Target className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-black text-foreground mb-1">
                                Session Complete! 🎯
                            </h2>
                            {taskTitle && (
                                <p className="text-sm text-muted-foreground">
                                    Focused on: <span className="font-bold">{taskTitle}</span>
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="space-y-4 mb-6">
                    {/* Focus Percentage */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Brain className="h-4 w-4 text-purple-400" />
                                <span className="text-xs font-bold text-muted-foreground uppercase">
                                    Focus Quality
                                </span>
                            </div>
                            {isImproved && (
                                <div className="flex items-center gap-1 text-emerald-400">
                                    <TrendingUp className="h-3 w-3" />
                                    <span className="text-xs font-bold">
                                        +{improvement.toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-foreground">
                                {focusPercentage.toFixed(0)}%
                            </span>
                            <span className="text-sm text-muted-foreground">
                                vs avg {previousAverage.toFixed(0)}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${focusPercentage}%` }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            />
                        </div>
                    </div>

                    {/* Distractions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                                Distractions
                            </p>
                            <p className="text-2xl font-black text-foreground">
                                {distractionCount}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                                Away Time
                            </p>
                            <p className="text-2xl font-black text-foreground">
                                {Math.round(totalDistractTime)}s
                            </p>
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                            Session Duration
                        </p>
                        <p className="text-2xl font-black text-foreground">
                            {duration} minutes
                        </p>
                    </div>
                </div>

                {/* Motivational Message */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-6">
                    <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-foreground mb-1">
                                {isPerfectFocus
                                    ? "Legendary focus! Keep this momentum! 🚀"
                                    : focusPercentage >= 90
                                        ? "Excellent focus! You're in the zone! 🔥"
                                        : focusPercentage >= 75
                                            ? "Great work! Small improvements add up! 💪"
                                            : "Every session is progress. Keep going! 🌱"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isImproved
                                    ? `You improved by ${improvement.toFixed(0)}% from your average!`
                                    : "Try minimizing notifications for better focus next time."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onClose}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        Continue
                    </button>
                    {onReview && (
                        <button
                            onClick={onReview}
                            className="w-full h-12 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                        >
                            Review Session Notes
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
