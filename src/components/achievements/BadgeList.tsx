"use client";

import React from "react";
import { BADGES } from "@/data/badges";
import { useTask } from "@/context/TaskContext";

export const BadgeList = () => {
  const { tasks, calculateStreak } = useTask();

  // Calculate stats for badge conditions
  const maxStreak = tasks.length > 0 ? Math.max(...tasks.map(t => calculateStreak(t))) : 0;
  
  // Calculate total completed tasks ever (sum of history lengths)
  const totalCompleted = tasks.reduce((sum, t) => sum + t.completionHistory.length, 0);
  
  const tasksCount = tasks.length;

  const stats = { totalCompleted, maxStreak, tasksCount };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {BADGES.map((badge) => {
        const isUnlocked = badge.condition(stats);
        
        return (
          <div
            key={badge.id}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
              isUnlocked
                ? "border-purple-500/50 bg-purple-500/10"
                : "border-border bg-card opacity-50 grayscale"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-2xl shadow-sm">
              {badge.icon}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">
                {badge.name}
              </h4>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
              {!isUnlocked && (
                  <span className="mt-1 text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">Locked</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
