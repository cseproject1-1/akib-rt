"use client";

import React from "react";
import { Check, Bell, Clock, ChevronRight } from "lucide-react";
import { Task, useTask } from "@/context/TaskContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { toggleTaskCompletion } = useTask();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  };

  return (
    <div
      onClick={() => onEdit(task)}
      className={cn(
        "group relative flex cursor-pointer items-center brutal-border border-4 p-5 transition-all duration-200",
        task.isCompleted
          ? "bg-muted/40 border-foreground/30 opacity-70 grayscale"
          : "bg-background border-foreground hover:brutal-shadow active:translate-x-0.5 active:translate-y-0.5"
      )}
    >
      <button
        onClick={handleToggle}
        className={cn(
          "mr-5 flex h-12 w-12 shrink-0 items-center justify-center brutal-border border-4 transition-all duration-200 relative z-20",
          task.isCompleted
            ? "bg-primary text-primary-foreground scale-100"
            : "bg-background hover:bg-muted"
        )}
      >
        {task.isCompleted ? (
          <Check className="h-8 w-8 stroke-[4] animate-in zoom-in duration-200" />
        ) : (
          <Check className="h-8 w-8 text-transparent stroke-[4] group-hover:text-foreground/10" />
        )}
      </button>
 
      <div className={cn(
        "mr-5 flex h-16 w-16 shrink-0 items-center justify-center brutal-border border-4 text-4xl shadow-none transition-all group-hover:scale-110 group-hover:-rotate-3",
        task.isCompleted ? "bg-muted" : "bg-primary italic"
      )}>
        <span className="filter drop-shadow-sm">{task.icon || "📝"}</span>
      </div>
 
      <div className="flex-1 overflow-hidden pointer-events-none relative z-10">
        <h3 className={cn(
          "truncate text-2xl font-black tracking-tighter transition-all uppercase italic leading-none",
          task.isCompleted ? "text-muted-foreground line-through decoration-4 decoration-foreground/30" : "text-foreground"
        )}>
          {task.title}
        </h3>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 brutal-border border-2">
            <Clock className="w-4 h-4 text-primary" />
            {task.startTime}
          </div>
          {task.reminder && (
            <div className="flex items-center gap-2 text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 brutal-border border-2 border-primary/30">
              <Bell className="w-4 h-4" />
              <span>{task.reminder}</span>
            </div>
          )}
        </div>
      </div>
 
      <ChevronRight className="w-8 h-8 text-foreground/20 group-hover:text-foreground transition-colors ml-4" />
    </div>
  );
};

export { TaskCard };
