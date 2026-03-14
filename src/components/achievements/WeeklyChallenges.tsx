"use client";

import React from "react";
import { useAchievements } from "@/context/AchievementsContext";
import { Target, Clock, CheckCircle, Trophy, Zap } from "lucide-react";
import { format, differenceInHours } from "date-fns";

export const WeeklyChallenges: React.FC = () => {
    const { weeklyChallenges } = useAchievements();

    const getProgressColor = (current: number, target: number) => {
        const percent = (current / target) * 100;
        if (percent >= 100) return "from-emerald-500 to-green-500";
        if (percent >= 60) return "from-purple-500 to-pink-500";
        if (percent >= 30) return "from-blue-500 to-cyan-500";
        return "from-gray-500 to-gray-400";
    };

    const isCompleted = (current: number, target: number) => current >= target;

    return (
        <div className="rounded-3xl bg-card border border-border p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Weekly Challenges</h3>
                        <p className="text-xs text-muted-foreground">Complete for bonus XP</p>
                    </div>
                </div>

                {/* Time remaining */}
                {weeklyChallenges[0] && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{differenceInHours(new Date(weeklyChallenges[0].expiresAt), new Date())}h left</span>
                    </div>
                )}
            </div>

            {/* Challenges List */}
            <div className="space-y-4">
                {weeklyChallenges.map((challenge) => {
                    const completed = isCompleted(challenge.current, challenge.target);
                    const progressPercent = Math.min((challenge.current / challenge.target) * 100, 100);

                    return (
                        <div
                            key={challenge.id}
                            className={`p-4 rounded-2xl border transition-all ${completed
                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                    : "bg-white/[0.02] border-white/10 hover:border-purple-500/30"
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${completed ? "bg-emerald-500/20" : "bg-white/5"
                                    }`}>
                                    {challenge.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-bold ${completed ? "text-emerald-400" : "text-foreground"}`}>
                                            {challenge.title}
                                        </h4>
                                        {completed && (
                                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-muted-foreground">
                                                {challenge.current} / {challenge.target}
                                            </span>
                                            <span className={`font-bold ${completed ? "text-emerald-400" : "text-purple-400"}`}>
                                                {Math.round(progressPercent)}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(challenge.current, challenge.target)} transition-all duration-500`}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Reward */}
                                <div className="text-right shrink-0">
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Zap className="h-4 w-4" />
                                        <span className="text-lg font-bold">+{challenge.rewardXP}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">XP</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Completion Summary */}
            {weeklyChallenges.filter(c => isCompleted(c.current, c.target)).length === weeklyChallenges.length && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        <span className="font-bold text-emerald-400">All Challenges Complete!</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Come back next week for new challenges</p>
                </div>
            )}
        </div>
    );
};
