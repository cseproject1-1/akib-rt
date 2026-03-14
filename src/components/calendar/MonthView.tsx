import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/components/ui/Button";
import { Task } from "@/context/TaskContext";

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, tasks, onSelectDate, selectedDate }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // FIX: Get task status based on completionHistory for the specific date
  const getTaskStatus = (day: Date) => {
    const dayName = format(day, "EEE").toUpperCase();
    const dateStr = format(day, "yyyy-MM-dd");

    // FIX: Check both recurring days and specific dates
    const dayTasks = tasks.filter(t => {
      if (t.specificDate) {
        return t.specificDate === dateStr;
      }
      return t.days.includes(dayName);
    });

    if (dayTasks.length === 0) return { hasTasks: false, allCompleted: false };

    const completedCount = dayTasks.filter(t => t.completionHistory?.includes(dateStr)).length;
    const allCompleted = completedCount === dayTasks.length && dayTasks.length > 0;

    return { hasTasks: true, allCompleted };
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-xs font-semibold text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-sm">
        {days.map((day, dayIdx) => {
          const { hasTasks, allCompleted } = getTaskStatus(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex h-14 cursor-pointer flex-col items-center justify-center border-t border-r transition-colors first:border-l hover:bg-muted/50",
                !isSameMonth(day, monthStart) && "bg-muted/10 text-muted-foreground",
                isSelected && "bg-primary/10 font-bold text-primary"
              )}
            >
              <span className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                isSameDay(day, new Date()) && !isSelected && "bg-muted text-foreground font-bold",
                isSelected && "bg-primary text-white"
              )}>
                {format(day, "d")}
              </span>

              {hasTasks && (
                <span className={cn(
                  "mt-1 h-1.5 w-1.5 rounded-full",
                  allCompleted ? "bg-green-500" : "bg-primary/50"
                )}></span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export { MonthView };

