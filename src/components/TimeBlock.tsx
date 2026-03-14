"use client";

import React from "react";
import { TimeBlock as TimeBlockType, useTask } from "@/context/TaskContext";
import { TaskCard } from "./TaskCard";
import { Task } from "@/context/TaskContext";
import { Sunrise, Sun, SunMedium, Sunset, Moon, CloudSun, Clock } from "lucide-react";

interface TimeBlockProps {
  block: TimeBlockType;
  timeRange: string;
  onEditTask: (task: Task) => void;
}

const TimeBlock: React.FC<TimeBlockProps> = ({ block, timeRange, onEditTask }) => {
  const { getTasksByTimeBlock } = useTask();
  const tasks = getTasksByTimeBlock(block);

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const getBlockIcon = () => {
    switch (block) {
      case "Dawn": return <Sunrise className="w-6 h-6" />;
      case "Morning": return <CloudSun className="w-6 h-6" />;
      case "Noon": return <Sun className="w-6 h-6" />;
      case "Afternoon": return <SunMedium className="w-6 h-6" />;
      case "Evening": return <Sunset className="w-6 h-6" />;
      case "Night": return <Moon className="w-6 h-6" />;
      default: return null;
    }
  };

  const colors = {
    Dawn: "from-orange-500/10 to-pink-500/5 text-orange-500 border-orange-500/20",
    Morning: "from-yellow-500/10 to-orange-500/5 text-yellow-500 border-yellow-500/20",
    Noon: "from-blue-500/10 to-cyan-500/5 text-blue-500 border-blue-500/20",
    Afternoon: "from-sky-500/10 to-indigo-500/5 text-sky-500 border-sky-500/20",
    Evening: "from-purple-500/10 to-pink-500/5 text-purple-500 border-purple-500/20",
    Night: "from-indigo-500/10 to-blue-900/5 text-indigo-500 border-indigo-500/20",
  };

  return (
    <div className={`group flex flex-col h-full brutal-card border-4 border-foreground bg-card p-8 transition-all duration-200 hover:brutal-shadow-lg relative`}>
      {/* Visual Marker for progress */}
      <div
        className="absolute top-0 left-0 h-4 bg-primary transition-all duration-1000 brutal-border border-b-2 border-r-2 border-foreground"
        style={{ width: `${progress}%` }}
      />
 
      <div className="mb-10 mt-4 flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className={`flex h-20 w-20 items-center justify-center brutal-border border-4 bg-background shadow-none transition-transform group-hover:scale-105`}>
            {getBlockIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-foreground uppercase tracking-widest italic leading-none">{block}</h3>
            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.15em] bg-muted px-4 py-1 brutal-border border-2 w-fit">
              <Clock className="w-4 h-4" />
              {timeRange}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-foreground italic leading-none">{completedCount}</span>
            <span className="text-xl font-bold text-muted-foreground uppercase tracking-tighter">/ {tasks.length}</span>
          </div>
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest italic">Tasks</span>
        </div>
      </div>
 
      <div className="flex-1 space-y-6">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEditTask} />)
        ) : (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center brutal-border border-4 border-dashed border-foreground/30 bg-muted/20 p-8 text-center group-hover:border-primary transition-colors">
            <div className="h-12 w-12 brutal-border border-2 bg-muted flex items-center justify-center mb-4">
              <Sunrise className="w-6 h-6 opacity-40 text-foreground" />
            </div>
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest italic">No activities scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { TimeBlock };

