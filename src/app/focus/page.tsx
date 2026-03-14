"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import { TimerDisplay } from "@/components/focus/TimerDisplay";
import { SessionControls } from "@/components/focus/SessionControls";
import { AmbientPlayer } from "@/components/focus/AmbientPlayer";
import { FocusStats } from "@/components/focus/FocusStats";
import { QuickNotes } from "@/components/focus/QuickNotes";
import { SessionReport } from "@/components/focus/SessionReport";
import { FocusEnergyMeter } from "@/components/focus/FocusEnergyMeter";
import { PresetSelector } from "@/components/focus/PresetSelector";
import { ResumeSessionDialog } from "@/components/focus/ResumeSessionDialog";
import { Timer, Zap, Coffee, Target } from "lucide-react";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { getEnergyPatterns } from "@/lib/focusSessionUtils";

export default function FocusPage() {
  const {
    minutes,
    seconds,
    isActive,
    isPaused,
    toggleTimer,
    resetTimer,
    sessionType,
    setSession,
    totalSeconds,
    todayStats,
    currentPreset,
    changePreset,
    linkTask,
    unlinkTask,
    linkedTaskId,
    linkedTaskTitle,
    sessionNotes,
    setSessionNotes,
    showSessionReport,
    setShowSessionReport,
    lastSessionData,
    showResumeDialog,
    setShowResumeDialog,
    incompleteSession,
    resumeSession,
    discardIncompleteSession,
  } = useFocusTimer();

  const { tasks } = useTask();
  const { user } = useAuth();

  const [energyPatterns, setEnergyPatterns] = useState<any[]>([]);
  const [loadingEnergy, setLoadingEnergy] = useState(true);

  // Load energy patterns
  useEffect(() => {
    if (!user) return;

    const loadEnergyPatterns = async () => {
      try {
        const patterns = await getEnergyPatterns(user.uid, 30);
        setEnergyPatterns(patterns);
      } catch (error) {
        console.error("Failed to load energy patterns:", error);
      } finally {
        setLoadingEnergy(false);
      }
    };

    loadEnergyPatterns();
  }, [user]);

  const todaysTasks = useMemo(() => {
    // Filter for today's tasks
    return tasks.filter((t) => !t.isCompleted);
  }, [tasks]);

  const handleTaskSelection = (taskId: string) => {
    if (!taskId || taskId === "freestyle") {
      unlinkTask();
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      linkTask(task.id, task.title);
    }
  };

  const handleReviewNotes = () => {
    setShowSessionReport(false);
    // Could open a notes modal here
  };

  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden transition-colors duration-300">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/5 blur-[120px] rounded-full pointer-events-none" />

      <Header />

      <main className="container mx-auto max-w-6xl px-6 pt-12 relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-2">
            <Timer className="w-8 h-8" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
            Focus Engine
          </h2>
          <p className="text-muted-foreground font-medium max-w-md">
            Enter deep work. Select a task and synchronize your mind.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Timer & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Selector */}
            <div className="w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Target className="h-4 w-4 text-purple-400" />
              </div>
              <select
                value={linkedTaskId || ""}
                onChange={(e) => handleTaskSelection(e.target.value)}
                disabled={isActive}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled className="bg-zinc-900 text-white">
                  Select a Task to Focus On...
                </option>
                {todaysTasks.map((t) => (
                  <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                    {t.icon} {t.title}
                  </option>
                ))}
                <option value="freestyle" className="bg-zinc-900 text-white">
                  🎯 Freestyle Focus
                </option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Preset Selector */}
            <PresetSelector
              currentPreset={currentPreset}
              onSelectPreset={changePreset}
              disabled={isActive}
            />

            {/* Timer Card */}
            <div className="relative group">
              {/* Pulsing ring when active */}
              {isActive && !isPaused && (
                <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse blur-2xl -z-10" />
              )}

              <div className="rounded-[3rem] bg-card border border-border p-8 md:p-12 shadow-xl transition-all duration-500 hover:shadow-2xl">
                <div className="flex flex-col items-center space-y-12">
                  <TimerDisplay
                    minutes={minutes}
                    seconds={seconds}
                    isActive={isActive && !isPaused}
                    totalSeconds={totalSeconds}
                  />

                  <div className="w-full max-w-sm space-y-8">
                    <SessionControls
                      isActive={isActive}
                      isPaused={isPaused}
                      onToggle={toggleTimer}
                      onReset={resetTimer}
                      sessionType={sessionType}
                      onSetSession={setSession}
                    />

                    {/* Ambient Player */}
                    <div className="pt-8 border-t border-border/50 w-full flex justify-center">
                      <AmbientPlayer />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FocusFeature
                icon={Zap}
                title="Deep Focus"
                desc="Increases cognitive load handling by 40%."
              />
              <FocusFeature
                icon={Coffee}
                title="Smart Breaks"
                desc="Optimized intervals for maximum neuro-recovery."
              />
              <FocusFeature
                icon={Target}
                title="Anti-Distraction"
                desc="Tracks focus quality with real-time metrics."
              />
            </div>
          </div>

          {/* Right Column: Stats & Insights */}
          <div className="space-y-6">
            {/* Daily Stats Compact */}
            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-center flex-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Today's Focus
                </p>
                <p className="text-lg font-black text-foreground">
                  {todayStats.minutes}{" "}
                  <span className="text-xs font-medium text-muted-foreground">mins</span>
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center flex-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Sessions
                </p>
                <p className="text-lg font-black text-foreground">{todayStats.sessions}</p>
              </div>
            </div>

            {/* Focus Stats */}
            <FocusStats todayMinutes={todayStats.minutes} todaySessions={todayStats.sessions} />

            {/* Energy Meter */}
            {!loadingEnergy && energyPatterns.length > 0 && (
              <FocusEnergyMeter patterns={energyPatterns} currentHour={currentHour} />
            )}
          </div>
        </div>
      </main>

      {/* Quick Notes Floating Button */}
      <QuickNotes
        isVisible={isActive}
        onSave={setSessionNotes}
        existingNotes={sessionNotes}
      />

      {/* Session Report Modal */}
      {lastSessionData && (
        <SessionReport
          isOpen={showSessionReport}
          onClose={() => setShowSessionReport(false)}
          sessionData={lastSessionData}
          onReview={handleReviewNotes}
        />
      )}

      {/* Resume Session Dialog */}
      {incompleteSession && (
        <ResumeSessionDialog
          isOpen={showResumeDialog}
          onResume={resumeSession}
          onDiscard={discardIncompleteSession}
          sessionData={{
            duration: incompleteSession.duration,
            sessionType: incompleteSession.sessionType,
            taskTitle: incompleteSession.linkedTaskTitle || undefined,
            remainingMinutes: Math.floor(
              (incompleteSession.duration * 60 -
                (Date.now() - incompleteSession.startTime.toMillis()) / 1000) /
              60
            ),
            remainingSeconds: Math.floor(
              ((incompleteSession.duration * 60 -
                (Date.now() - incompleteSession.startTime.toMillis()) / 1000) %
                60)
            ),
          }}
        />
      )}

      <footer className="absolute bottom-8 left-0 w-full text-center px-6 pointer-events-none">
        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.5em]">
          Synchronize your mind • Deep work protocol
        </p>
      </footer>
    </div>
  );
}

function FocusFeature({ icon: Icon, title, desc }: any) {
  return (
    <div className="p-6 rounded-3xl bg-card border border-border space-y-2 group hover:bg-muted/50 transition-all text-center md:text-left shadow-sm hover:shadow-md">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-purple-500 mb-2 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-foreground tracking-tight">{title}</p>
      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
