"use client";

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { useTask } from "@/context/TaskContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Helper to get the date string for a given day of the week in the current week
const getDateForDayOfWeek = (dayName: string): string => {
  const today = new Date();
  const todayDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNameToIndex: Record<string, number> = {
    "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
  };
  const targetDayIndex = dayNameToIndex[dayName] ?? 1;
  const diff = targetDayIndex - todayDayIndex;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  return format(targetDate, "yyyy-MM-dd");
};

const DayNavigation: React.FC = () => {
  const { selectedDay, setSelectedDay, tasks } = useTask();
  const actualToday = format(new Date(), "EEE").toUpperCase();

  const getDayProgress = (day: string) => {
    const dayTasks = tasks.filter((t) => t.days.includes(day));
    if (dayTasks.length === 0) return 0;

    // FIX: Compute completion based on completionHistory for this specific day's date
    const dateStrForDay = getDateForDayOfWeek(day);
    const completed = dayTasks.filter((t) => t.completionHistory?.includes(dateStrForDay)).length;
    return Math.round((completed / dayTasks.length) * 100);
  };

  return (
    <div className="w-full overflow-x-auto pb-12 pt-6 scrollbar-hide px-2">
      <div className="flex min-w-max space-x-6">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isActualToday = actualToday === day;
          const progress = getDayProgress(day);
 
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "group relative flex flex-col items-center justify-center transition-all duration-200",
                "h-40 w-32 brutal-border",
                isSelected
                  ? "bg-primary text-primary-foreground brutal-shadow-lg z-10 -translate-y-2 border-4 border-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted brutal-shadow border-4 border-foreground"
              )}
            >
              {isActualToday && (
                <div className={cn(
                  "absolute top-4 left-4 h-4 w-4 brutal-border",
                  isSelected ? "bg-white" : "bg-primary"
                )} />
              )}
              <span className={cn(
                "text-sm font-black tracking-widest mb-4 transition-colors uppercase italic",
                isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {day}
              </span>
 
              <div className="flex flex-col items-center">
                <span className={cn(
                  "text-4xl font-black tracking-tighter leading-none mb-4 italic",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {progress}%
                </span>
 
                <div className={cn(
                  "h-3 w-20 brutal-border border-2 overflow-hidden",
                  isSelected ? "bg-black/20" : "bg-muted"
                )}>
                  <div
                    className={cn("h-full transition-all duration-1000", isSelected ? "bg-white" : "bg-primary")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { DayNavigation };


