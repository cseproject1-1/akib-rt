"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LandingPage } from "@/components/LandingPage";
import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { DayNavigation } from "@/components/DayNavigation";
import { TimeBlock } from "@/components/TimeBlock";
import { TaskModal } from "@/components/TaskModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import { TimeBlock as TimeBlockType, Task, useTask } from "@/context/TaskContext";
import { Button } from "@/components/ui/Button";
import { Plus, WifiOff } from "lucide-react";

const TIME_BLOCKS: TimeBlockType[] = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { loading: isTasksLoading, totalTasksToday, isOnline } = useTask();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);

  if (isAuthLoading || isTasksLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="brutal-border bg-primary p-8 brutal-shadow animate-bounce">
          <span className="text-4xl font-black uppercase tracking-tighter text-primary-foreground">Loading...</span>
        </div>
        <div className="mt-10 text-center space-y-2">
          <p className="text-xl font-bold uppercase tracking-tight text-foreground">Getting your routines ready</p>
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Stay Focused • Stay Disciplined</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const handleAddTask = () => {
    setTaskToEdit(undefined);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="flex flex-col gap-2">
          <ProgressBar onAddTask={handleAddTask} />

          <DayNavigation />

          {/* Offline Banner - Show when offline with cached data */}
          {(!isOnline && totalTasksToday > 0) && (
            <div className="my-8 brutal-card bg-accent border-foreground">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center justify-center w-16 h-16 brutal-border bg-background shadow-none flex-shrink-0">
                  <WifiOff className="w-8 h-8 text-foreground" />
                </div>
 
                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground italic underline decoration-primary decoration-4">
                    Working Offline
                  </h3>
 
                  <p className="text-base font-bold text-foreground leading-tight">
                    Your data is safe. Continue tracking—everything will sync automatically.
                  </p>
 
                  <div className="flex items-center gap-2 justify-center sm:justify-start mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 brutal-border bg-white text-black">
                      <div className="w-3 h-3 bg-green-500 brutal-border"></div>
                      <span className="text-xs font-black uppercase tracking-widest">Local data safe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State Banner - Only show when online with no tasks */}
          {(!isTasksLoading && totalTasksToday === 0 && isOnline) && (
            <div className="my-8 brutal-card bg-primary text-primary-foreground border-foreground brutal-shadow-lg">
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Ready to conquer the day?</h3>
                  <p className="text-primary-foreground font-bold tracking-tight max-w-md">Your schedule is clear. Start from scratch or use a proved template to hit the ground running.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleAddTask} variant="secondary" className="h-16 px-10 text-xl shadow-none hover:translate-x-1 hover:translate-y-1">
                    <Plus className="w-6 h-6 mr-2" /> Create Routine
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {TIME_BLOCKS.map((block) => (
              <TimeBlock
                key={block}
                block={block}
                timeRange={getTimeRange(block)}
                onEditTask={handleEditTask}
              />
            ))}
          </div>

          <OnboardingTour />
        </div>
      </main>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />

      {/* Footer / Info */}
      <footer className="py-16 text-center text-muted-foreground/40 text-xs font-black uppercase tracking-[0.3em] italic">
        Designed for Excellence • Powered by RT • 2026
      </footer>
    </div>
  );
}

function getTimeRange(block: TimeBlockType): string {
  switch (block) {
    case "Dawn": return "4:00 AM - 6:00 AM";
    case "Morning": return "6:00 AM - 12:00 PM";
    case "Noon": return "12:00 PM - 2:00 PM";
    case "Afternoon": return "2:00 PM - 5:00 PM";
    case "Evening": return "5:00 PM - 8:00 PM";
    case "Night": return "8:00 PM - 4:00 AM";
    default: return "";
  }
}
