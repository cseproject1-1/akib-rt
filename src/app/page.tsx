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
import { Plus } from "lucide-react";

const TIME_BLOCKS: TimeBlockType[] = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { loading: isTasksLoading, totalTasksToday } = useTask();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);

  if (isAuthLoading || isTasksLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Syncing your routines...</p>
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

          {/* Empty State Banner */}
          {(!isTasksLoading && totalTasksToday === 0) && (
            <div className="my-6 relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-8 border border-purple-500/20 text-center sm:text-left">
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">Ready to conquer the day?</h3>
                  <p className="text-muted-foreground max-w-md">Your schedule is clear. Start from scratch or use a proved template to hit the ground running.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleAddTask} className="bg-foreground text-background hover:opacity-90 font-bold rounded-xl h-12 px-6">
                    <Plus className="w-4 h-4 mr-2" /> Create Routine
                  </Button>
                </div>
              </div>
              {/* Background Decor */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
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
      <footer className="py-12 text-center text-muted-foreground/20 text-[10px] font-bold uppercase tracking-[0.2em]">
        Designed for Excellence • Powered by RT
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
