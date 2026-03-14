"use client";

import React from "react";
import { cn, Button } from "@/components/ui/Button";
import { TrendingUp, Target, Flame, CheckCircle, Share2 } from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { toast } from "sonner";

interface UserRankCardProps {
    rank: number;
    totalUsers: number;
}

export const UserRankCard: React.FC<UserRankCardProps> = ({ rank, totalUsers }) => {
    const { tasks, getCompletionRate, calculateStreak } = useTask();

    const completionRate = getCompletionRate(7);
    const maxStreak = tasks.length > 0 ? Math.max(...tasks.map(t => calculateStreak(t))) : 0;
    const totalCompleted = tasks.reduce((sum, t) => sum + t.completionHistory.length, 0);

    const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0;

    const handleShare = async () => {
        const shareData = {
            title: 'My RT Ranking',
            text: `I'm ranked #${rank} on Routine Tracker with a ${maxStreak}-day streak! 🚀`,
            url: window.location.origin
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                toast.success("Copied to clipboard!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 p-6">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
                            Your Ranking
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-white">#{rank}</span>
                            <span className="text-muted-foreground">of {totalUsers}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleShare}
                            className="h-16 w-16 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            <Share2 className="h-6 w-6" />
                        </Button>
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                            <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Top {totalUsers > 0 ? 100 - percentile : 0}% of users</span>
                        <span className="text-sm font-bold text-purple-400">{percentile}th percentile</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${percentile}%` }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-2xl bg-white/5 text-center">
                        <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-400" />
                        <div className="text-lg font-bold text-white">{completionRate}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">7-Day Rate</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 text-center">
                        <Flame className="h-5 w-5 mx-auto mb-1 text-orange-400" />
                        <div className="text-lg font-bold text-white">{maxStreak}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Best Streak</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 text-center">
                        <Target className="h-5 w-5 mx-auto mb-1 text-purple-400" />
                        <div className="text-lg font-bold text-white">{totalCompleted}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Completed</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
