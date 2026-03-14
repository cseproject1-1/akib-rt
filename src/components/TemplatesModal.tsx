"use client";

import React, { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useTask, Task } from "@/context/TaskContext";
import { useAI } from "@/context/AIContext";
import { Save, Download, LayoutTemplate, Star, Sparkles } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useConfirm } from "./ui/ConfirmDialog";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose }) => {
  const { saveAsTemplate, applyTemplate, templates, replaceAllTasks } = useTask();
  const { sendMessage, isLoading: isAiLoading } = useAI();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [newTemplateName, setNewTemplateName] = useState("");

  const handleMagicRoutine = async () => {
    const confirmed = await confirm({
      title: "Generate magical routine?",
      description: "AI will create a personalized morning routine and append tasks to your current schedule.",
      confirmText: "Generate",
      cancelText: "Cancel",
      type: "info"
    });

    if (confirmed) {
      await sendMessage("Generate a 3-step morning productivity routine for me with time blocks.");
      onClose();
    }
  };

  const handleSave = () => {
    if (newTemplateName.trim()) {
      saveAsTemplate(newTemplateName);
      setNewTemplateName("");
    }
  };

  const handleApply = async (name: string) => {
    const confirmed = await confirm({
      title: `Apply "${name}" template?`,
      description: "This will replace all your current tasks with the tasks from this template.",
      confirmText: "Apply Template",
      cancelText: "Cancel",
      type: "warning"
    });

    if (confirmed) {
      applyTemplate(name);
      onClose();
    }
  };

  const WORK_DAY_PRESET: Omit<Task, "id" | "isCompleted" | "completionHistory">[] = [
    { title: "Morning Standup", icon: "💼", startTime: "09:00", endTime: "09:30", timeBlock: "Morning", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { title: "Deep Work", icon: "💻", startTime: "10:00", endTime: "12:00", timeBlock: "Morning", days: ["MON", "TUE", "WED", "THU", "FRI"] },
    { title: "Lunch Break", icon: "🍔", startTime: "12:00", endTime: "13:00", timeBlock: "Noon", days: ["MON", "TUE", "WED", "THU", "FRI"] },
  ];

  const STUDY_PRESET: Omit<Task, "id" | "isCompleted" | "completionHistory">[] = [
    { title: "Review Notes", icon: "📚", startTime: "08:00", endTime: "09:00", timeBlock: "Morning", days: ["MON", "WED", "FRI"] },
    { title: "Lecture", icon: "🎓", startTime: "10:00", endTime: "12:00", timeBlock: "Morning", days: ["MON", "WED", "FRI"] },
  ];

  const applyPreset = async (presetName: string, presetTasks: Omit<Task, "id" | "isCompleted" | "completionHistory">[]) => {
    const confirmed = await confirm({
      title: `Apply "${presetName}" preset?`,
      description: "This will overwrite all your current tasks with this preset routine.",
      confirmText: "Apply Preset",
      cancelText: "Cancel",
      type: "warning"
    });

    if (confirmed) {
      const newTasks: Task[] = presetTasks.map(t => ({
        ...t,
        id: uuidv4(),
        isCompleted: false,
        completionHistory: []
      }));
      replaceAllTasks(newTasks);
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Routine Templates">
      <div className="space-y-8 py-2">
        {/* Save Section */}
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Save className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Save Current</span>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Name your template..."
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="bg-black/20 border-white/5 h-12"
            />
            <Button
              onClick={handleSave}
              disabled={!newTemplateName.trim()}
              className="h-12 w-12 rounded-xl bg-purple-500 hover:bg-purple-600 text-white border-0 shrink-0 shadow-lg"
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* User Templates */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-purple-400">
            <LayoutTemplate className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">My Templates</span>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
            {Object.keys(templates).length === 0 ? (
              <div className="text-center py-10 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
                <p className="text-sm font-medium text-muted-foreground/40 italic">No saved templates</p>
              </div>
            ) : (
              Object.keys(templates).map((name) => (
                <div
                  key={name}
                  className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05] hover:border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                      <Star className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-white tracking-tight">{name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApply(name)}
                    className="rounded-xl bg-white/5 hover:bg-purple-500 hover:text-white transition-all px-4"
                  >
                    Apply
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Download className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Global Presets</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Magic Routine Button */}
            <button
              onClick={handleMagicRoutine}
              disabled={isAiLoading}
              className="col-span-2 flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                  <Sparkles className={cn("h-5 w-5", isAiLoading && "animate-spin")} />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">Magic Routine</span>
                  <span className="text-[10px] font-medium text-purple-400 uppercase opacity-80">AI-Generated</span>
                </div>
              </div>
              <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors">
                {isAiLoading ? "Generating..." : "Generate"}
              </span>
            </button>

            <button
              onClick={() => applyPreset("Work Day", WORK_DAY_PRESET)}
              className="flex flex-col items-start p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all text-left"
            >
              <span className="text-sm font-bold text-white mb-1">Work Day</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-60">Full Business Routine</span>
            </button>
            <button
              onClick={() => applyPreset("Study Session", STUDY_PRESET)}
              className="flex flex-col items-start p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all text-left"
            >
              <span className="text-sm font-bold text-white mb-1">Study Session</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-60">Academic Focus</span>
            </button>
          </div>
        </div>
      </div>
      {ConfirmDialogComponent}
    </Modal>
  );
};

export { TemplatesModal };
