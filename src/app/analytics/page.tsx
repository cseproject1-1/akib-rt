"use client";

import React from "react";
import { Header } from "@/components/Header";
import { CompletionChart } from "@/components/analytics/CompletionChart";
import { HeatmapCalendar } from "@/components/analytics/HeatmapCalendar";
import { ProductivityScore } from "@/components/analytics/ProductivityScore";
import { HabitInsights } from "@/components/analytics/HabitInsights";
import { useTask } from "@/context/TaskContext";
import { useAnalytics } from "@/context/AnalyticsContext";
import { BarChart3, TrendingUp, Award, Activity, PieChart, Calendar, Flame, Target, Zap } from "lucide-react";

export default function AnalyticsPage() {
  const { getCompletionRate, tasks, calculateStreak } = useTask();
  const {
    totalTasksCompleted,
    currentStreak,
    longestStreak,
    thisWeekCompleted,
    thisWeekTotal,
    lastWeekCompleted
  } = useAnalytics();

  const weeklyRate = getCompletionRate(7);
  const maxStreak = tasks.length > 0 ? Math.max(...tasks.map(t => calculateStreak(t))) : 0;

  const weeklyChange = thisWeekCompleted - lastWeekCompleted;
  const weeklyChangePercent = lastWeekCompleted > 0 ? Math.round((weeklyChange / lastWeekCompleted) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container mx-auto max-w-6xl px-6 pt-12 space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tighter text-foreground flex items-center gap-3">
            <BarChart3 className="h-10 w-10 text-purple-400" />
            Bio-Metrics
          </h2>
          <p className="text-muted-foreground font-medium">Deep analysis of your discipline and consistency architecture.</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickStat
            icon={Flame}
            iconColor="text-orange-400"
            label="Current Streak"
            value={`${currentStreak}`}
            unit="days"
          />
          <QuickStat
            icon={Award}
            iconColor="text-yellow-400"
            label="Longest Streak"
            value={`${longestStreak}`}
            unit="days"
          />
          <QuickStat
            icon={Target}
            iconColor="text-purple-400"
            label="Total Completed"
            value={`${totalTasksCompleted}`}
            unit="tasks"
          />
          <QuickStat
            icon={Zap}
            iconColor="text-emerald-400"
            label="This Week"
            value={`${thisWeekCompleted}/${thisWeekTotal}`}
            unit={weeklyChange >= 0 ? `+${weeklyChange}` : `${weeklyChange}`}
            unitColor={weeklyChange >= 0 ? "text-emerald-400" : "text-red-400"}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Heatmap Calendar */}
            <div className="rounded-[2.5rem] bg-card border border-border p-8 shadow-lg">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-emerald-400" />
                Activity Heatmap
              </h3>
              <div className="overflow-x-auto pb-4">
                <HeatmapCalendar days={365} />
              </div>
            </div>

            {/* Completion Chart */}
            <div className="rounded-[2.5rem] bg-card border border-border p-8 shadow-lg">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                Performance Trends
              </h3>
              <CompletionChart />
            </div>
          </div>

          {/* Right Column - Score & Insights */}
          <div className="space-y-6">
            {/* Productivity Score */}
            <ProductivityScore size="md" showDetails={true} />

            {/* Habit Insights */}
            <div className="rounded-3xl bg-card border border-border p-6">
              <HabitInsights />
            </div>
          </div>
        </div>

        {/* Legacy Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            icon={TrendingUp}
            label="7-Day Efficiency"
            value={`${weeklyRate}%`}
            sub="Aggregated consistency"
          />
          <MetricCard
            icon={Award}
            label="Peak Task Streak"
            value={`${maxStreak} Days`}
            sub="Highest task-specific streak"
          />
          <MetricCard
            icon={Activity}
            label="Active Rituals"
            value={tasks.length.toString()}
            sub="Total scheduled tasks"
          />
        </div>
      </main>
    </div>
  );
}

function QuickStat({ icon: Icon, iconColor, label, value, unit, unitColor }: any) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border group hover:border-purple-500/30 transition-all">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground tracking-tight">{value}</span>
            <span className={`text-xs font-medium ${unitColor || "text-muted-foreground"}`}>{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="p-8 rounded-[2.5rem] bg-card border border-border space-y-4 group hover:shadow-lg transition-all">
      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">{label}</p>
        <h4 className="text-4xl font-bold text-foreground tracking-tighter mt-1">{value}</h4>
        <p className="text-xs font-medium text-muted-foreground mt-2">{sub}</p>
      </div>
    </div>
  );
}
