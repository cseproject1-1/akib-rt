"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/Button";
import { Plus, RotateCcw, Calendar as CalendarIcon, Activity, Sparkles, Clock, Trophy, Zap } from "lucide-react";
import { useConfirm } from "./ui/ConfirmDialog";

interface ProgressBarProps {
  onAddTask: () => void;
}

// Time-based greetings with emojis
const getTimeBasedGreeting = (hour: number, progress: number, userName?: string): { title: string; subtitle: string } => {
  const name = userName ? `, ${userName.split(" ")[0]}` : "";

  // Perfect day celebration
  if (progress === 100) {
    return {
      title: `Champion Mode! 🏆`,
      subtitle: `You've conquered today${name}! Time to celebrate your wins.`
    };
  }

  // Time-based greetings
  if (hour >= 5 && hour < 12) {
    return {
      title: `Rise & Shine${name}! ☀️`,
      subtitle: "Fresh start, fresh opportunities. Let's make today count!"
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      title: `Keep Pushing${name}! 💪`,
      subtitle: "Afternoon hustle mode activated. You're doing great!"
    };
  } else if (hour >= 17 && hour < 21) {
    return {
      title: `Almost There${name}! 🌅`,
      subtitle: "Evening wind-down approaching. Finish strong!"
    };
  } else {
    return {
      title: `Night Owl${name}! 🌙`,
      subtitle: "Burning the midnight oil? Rest is productive too."
    };
  }
};

// Motivational quotes
const quotes = [
  "Small steps every day lead to big changes.",
  "Consistency beats intensity. Keep showing up.",
  "Your future self will thank you for this.",
  "Progress, not perfection.",
  "Every task completed is a victory.",
  "Build the life you want, one routine at a time.",
  "Discipline is choosing what you want most over what you want now.",
  "The secret of getting ahead is getting started."
];

const ProgressBar: React.FC<ProgressBarProps> = ({ onAddTask }) => {
  const { dailyProgress, completedTasksToday, totalTasksToday, todayDate, resetDay, tasks } = useTask();
  const { user } = useAuth();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  // Animate progress on mount/change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(dailyProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [dailyProgress]);

  // Celebration effect when reaching 100%
  useEffect(() => {
    if (dailyProgress === 100 && totalTasksToday > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [dailyProgress, totalTasksToday]);

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Get current hour for time-based greeting
  const currentHour = new Date().getHours();
  const greeting = getTimeBasedGreeting(currentHour, dailyProgress, user?.displayName || undefined);

  // Find next upcoming task
  const nextTask = useMemo(() => {
    const now = new Date();
    const currentTime = format(now, "HH:mm");
    const todayDayName = format(now, "EEE").toUpperCase();

    const upcomingTasks = tasks
      .filter(task => task.days.includes(todayDayName) && task.startTime > currentTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return upcomingTasks[0] || null;
  }, [tasks]);

  // Calculate time until next task
  const timeUntilNext = useMemo(() => {
    if (!nextTask) return null;

    const now = new Date();
    const [hours, mins] = nextTask.startTime.split(":").map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, mins, 0, 0);

    const diffMs = taskTime.getTime() - now.getTime();
    if (diffMs <= 0) return null;

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  }, [nextTask]);

  return (
    <div className="relative w-full brutal-card bg-primary p-6 sm:p-10 mb-8 sm:mb-12 border-foreground/30 brutal-shadow-lg">
 
      {/* Celebration Confetti Effect */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden bg-white/10">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti font-black"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {[ "WIN", "DONE", "TOP", "STAR"][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}
 
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }} />
 
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12 text-primary-foreground">
        <div className="space-y-6 flex-1">
          {/* Date Badge */}
          <div className="flex items-center gap-3 bg-foreground/10 w-fit px-4 py-2 brutal-border border-foreground/20">
            <CalendarIcon className="w-4 h-4 text-foreground" />
            <span className="text-xs font-black tracking-widest uppercase">
              {format(todayDate, "EEEE, MMMM d, yyyy")}
            </span>
          </div>
 
          {/* Dynamic Greeting */}
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic">
              {greeting.title}
            </h2>
            <p className="text-xl font-bold uppercase tracking-tight max-w-lg bg-foreground text-background px-4 py-1 brutal-border inline-block">
              {greeting.subtitle}
            </p>
          </div>
 
          {/* Rotating Quote */}
          <div className="flex items-start gap-4 bg-muted/20 p-4 brutal-border border-foreground/20 max-w-lg">
            <Sparkles className="w-6 h-6 text-foreground shrink-0 mt-1" />
            <p className="text-sm font-bold leading-snug uppercase italic transition-opacity duration-500">
              "{quotes[currentQuoteIndex]}"
            </p>
          </div>
 
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              onClick={onAddTask}
              className="bg-foreground text-background hover:bg-background hover:text-foreground font-black px-10 h-16 text-xl brutal-border border-4"
            >
              <Plus className="mr-2 h-7 w-7" /> Create Task
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const confirmed = await confirm({
                  title: "Reset all tasks for today?",
                  description: "This will uncheck all completed tasks for today. This action cannot be undone.",
                  confirmText: "Reset Today",
                  cancelText: "Cancel",
                  type: "warning"
                });
                if (confirmed) resetDay();
              }}
              className="bg-transparent text-foreground hover:bg-foreground/10 font-black h-16 px-8 text-lg brutal-border border-4"
            >
              <RotateCcw className="mr-2 h-6 w-6" /> Reset Today
            </Button>
          </div>
        </div>
 
        {/* Stats Card */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-8 bg-background p-8 brutal-card border-4 border-foreground shadow-[12px_12px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_rgba(255,255,0,1)]">
 
          {/* Progress Ring */}
          <div className="relative flex items-center justify-center mx-auto sm:mx-0">
            <svg className="h-32 w-32 sm:h-40 sm:w-40 -rotate-90 transform">
              <circle
                className="text-muted/30"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
                r={radius + 4}
                cx="50%"
                cy="50%"
              />
              <circle
                className="text-primary transition-all duration-[1500ms] ease-out"
                strokeWidth="12"
                strokeDasharray={circumference + 25}
                strokeDashoffset={circumference - (animatedProgress / 100) * circumference}
                strokeLinecap="butt"
                stroke="currentColor"
                fill="transparent"
                r={radius + 4}
                cx="50%"
                cy="50%"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-foreground">{Math.round(animatedProgress)}%</span>
            </div>
          </div>
 
          {/* Stats & Next Task */}
          <div className="flex flex-col gap-6 flex-1 min-w-0">
            {/* Completion Stats */}
            <div className="space-y-1 text-foreground">
              <p className="text-xs font-black uppercase tracking-[0.2em]">Daily Completion</p>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-black tabular-nums tracking-tighter">{completedTasksToday}</span>
                <span className="text-3xl font-bold text-muted-foreground mb-1">/ {totalTasksToday}</span>
              </div>
            </div>
 
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center brutal-border border-2 transition-all ${dailyProgress === 100 && totalTasksToday > 0
                ? "bg-primary text-primary-foreground animate-bounce"
                : "bg-foreground text-background"
                }`}>
                {dailyProgress === 100 && totalTasksToday > 0 ? (
                  <Trophy className="w-5 h-5" />
                ) : (
                  <Activity className="w-5 h-5" />
                )}
              </div>
              <span className={`text-sm font-black uppercase tracking-widest ${dailyProgress === 100 && totalTasksToday > 0 ? "text-primary" : "text-foreground"
                }`}>
                {completedTasksToday === totalTasksToday && totalTasksToday > 0 ? "Perfect Day!" : "In Progress"}
              </span>
            </div>
 
            {/* Next Task Preview */}
            {nextTask && (
              <div className="flex items-center gap-4 brutal-border border-2 p-3 bg-muted/20">
                <div className="flex h-12 w-12 items-center justify-center brutal-border border-2 bg-primary text-2xl shrink-0">
                  {nextTask.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground uppercase truncate tracking-tight">{nextTask.title}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">
                      {nextTask.startTime} • in {timeUntilNext}
                    </span>
                  </div>
                </div>
                <Zap className="w-5 h-5 text-primary shrink-0 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {ConfirmDialogComponent}
    </div>
  );
};

export { ProgressBar };
