"use client";

import React, { useState, useEffect } from "react";
import { useTask } from "@/context/TaskContext";
import { useAnalytics } from "@/context/AnalyticsContext";
import { useAI } from "@/context/AIContext";
import { FileText, Sparkles, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Download, Share2, Calendar, Target, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

export const WeeklyReview: React.FC = () => {
    const { tasks, getCompletionRate } = useTask();
    const { currentStreak, productivityScore, getInsights, thisWeekCompleted, thisWeekTotal, lastWeekCompleted } = useAnalytics();
    const { aiEnabled, aiPlatform } = useAI();

    const [review, setReview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());

    const weeklyComparison = thisWeekCompleted - lastWeekCompleted;
    const weeklyComparisonPercent = lastWeekCompleted > 0
        ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
        : 0;

    const completionRate = getCompletionRate(7);
    const insights = getInsights();

    const generateReview = async () => {
        if (!aiEnabled) {
            setError("AI is disabled. Enable it in Settings.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const endpoint = aiPlatform === "groq" ? "/api/ai/groq-chat" : "/api/ai/chat";

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `Generate a motivating weekly review summary. Here are the stats:
- Tasks completed this week: ${thisWeekCompleted}/${thisWeekTotal}
- Completion rate: ${completionRate}%
- Current streak: ${currentStreak} days
- Productivity score: ${productivityScore}/100
- Compared to last week: ${weeklyComparison >= 0 ? '+' : ''}${weeklyComparison} tasks

Please write a brief, personalized weekly review (3-4 sentences) that:
1. Celebrates wins and progress
2. Identifies one area for improvement
3. Provides motivation for next week

Keep it concise and uplifting.`,
                    context: { tasks: [], goals: [] },
                    conversationHistory: []
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to generate review");
            }

            setReview(data.message);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        const shareText = `📊 My Weekly Review (${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")})

✅ Completed: ${thisWeekCompleted}/${thisWeekTotal} tasks
📈 Rate: ${completionRate}%
🔥 Streak: ${currentStreak} days
⭐ Score: ${productivityScore}/100

${review || ""}

#ProductivityTracker #WeeklyReview`;

        try {
            if (navigator.share) {
                await navigator.share({ text: shareText });
            } else {
                await toast.promise(
                    navigator.clipboard.writeText(shareText),
                    {
                        loading: "Copying...",
                        success: "Copied to clipboard! 📋",
                        error: "Failed to copy"
                    }
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="rounded-3xl bg-card border border-border p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Weekly Review</h3>
                        <p className="text-xs text-muted-foreground">
                            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {review && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleShare}
                            className="h-8 w-8"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard
                    icon={Target}
                    label="Completed"
                    value={`${thisWeekCompleted}/${thisWeekTotal}`}
                    color="text-purple-400"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Rate"
                    value={`${completionRate}%`}
                    color="text-emerald-400"
                />
                <StatCard
                    icon={Flame}
                    label="Streak"
                    value={`${currentStreak}d`}
                    color="text-orange-400"
                />
                <StatCard
                    icon={weeklyComparison >= 0 ? TrendingUp : TrendingDown}
                    label="vs Last Week"
                    value={`${weeklyComparison >= 0 ? '+' : ''}${weeklyComparison}`}
                    color={weeklyComparison >= 0 ? "text-emerald-400" : "text-red-400"}
                />
            </div>

            {/* AI Review Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                {!review && !isLoading && !error && (
                    <div className="text-center py-4">
                        <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                        <h4 className="font-bold text-foreground mb-2">AI Weekly Summary</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Get a personalized review of your week with insights and tips
                        </p>
                        <Button
                            onClick={generateReview}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Review
                        </Button>
                    </div>
                )}

                {isLoading && (
                    <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Analyzing your week...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-4">
                        <p className="text-sm text-red-400 mb-3">{error}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateReview}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                )}

                {review && !isLoading && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Summary</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{review}</p>
                        <div className="mt-4 pt-4 border-t border-purple-500/20 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={generateReview}
                                className="text-xs"
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regenerate
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Insights */}
            {insights.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick Insights</h4>
                    {insights.slice(0, 2).map((insight, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-purple-400">•</span>
                            <span>{insight.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="p-3 rounded-xl bg-white/5 text-center">
            <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        </div>
    );
}
