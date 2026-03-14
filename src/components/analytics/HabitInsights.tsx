"use client";

import React from "react";
import { useAnalytics } from "@/context/AnalyticsContext";
import { Lightbulb, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";

export const HabitInsights: React.FC = () => {
    const { getInsights, getTimeBlockStats, getDayOfWeekStats } = useAnalytics();

    const insights = getInsights();
    const timeStats = getTimeBlockStats();
    const dayStats = getDayOfWeekStats();

    const getInsightIcon = (type: string) => {
        switch (type) {
            case "positive":
                return <Sparkles className="h-4 w-4 text-emerald-400" />;
            case "warning":
                return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
            default:
                return <Lightbulb className="h-4 w-4 text-blue-400" />;
        }
    };

    const getInsightBg = (type: string) => {
        switch (type) {
            case "positive":
                return "bg-emerald-500/10 border-emerald-500/20";
            case "warning":
                return "bg-yellow-500/10 border-yellow-500/20";
            default:
                return "bg-blue-500/10 border-blue-500/20";
        }
    };

    return (
        <div className="space-y-6">
            {/* AI Insights */}
            <div>
                <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                    Smart Insights
                </h4>
                <div className="space-y-3">
                    {insights.length > 0 ? (
                        insights.map((insight, i) => (
                            <div
                                key={i}
                                className={`p-4 rounded-2xl border ${getInsightBg(insight.type)} transition-all hover:scale-[1.02]`}
                            >
                                <div className="flex items-start gap-3">
                                    {getInsightIcon(insight.type)}
                                    <div className="flex-1">
                                        <p className="text-sm text-foreground leading-relaxed">{insight.message}</p>
                                        {insight.metric && (
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/10 text-xs font-bold text-purple-400">
                                                {insight.metric}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 rounded-2xl bg-muted/50 text-center">
                            <p className="text-sm text-muted-foreground">
                                Complete more tasks to unlock personalized insights!
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Time Block Performance */}
            <div>
                <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    Time Block Performance
                </h4>
                <div className="space-y-2">
                    {timeStats.filter(s => s.totalTasks > 0).map((stat) => (
                        <div key={stat.block} className="flex items-center gap-3">
                            <span className="w-20 text-xs font-medium text-muted-foreground">{stat.block}</span>
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ width: `${stat.completionRate}%` }}
                                />
                            </div>
                            <span className="w-12 text-xs font-bold text-foreground text-right">{stat.completionRate}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Day of Week Performance */}
            <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Weekly Pattern</h4>
                <div className="flex gap-2">
                    {dayStats.map((stat) => (
                        <div key={stat.day} className="flex-1 text-center">
                            <div className="relative mx-auto w-8 h-20 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ height: `${stat.completionRate}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground mt-2 block">
                                {stat.day.slice(0, 1)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
