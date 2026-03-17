"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Task, TimeBlock as TimeBlockType, useTask } from "@/context/TaskContext";
import { Trash2, Clock, Calendar, Bell, Smile, Copy } from "lucide-react";
import { format } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task;
  defaultDay?: string; // Pre-select a specific day (e.g., "MON", "TUE", etc.)
  specificDate?: string; // "YYYY-MM-DD" - if set, creates a single-occurrence task
}

const TIME_BLOCKS: TimeBlockType[] = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const REMINDERS = [
  { label: "None", value: "" },
  { label: "5m before", value: "5m" },
  { label: "10m before", value: "10m" },
  { label: "15m before", value: "15m" },
  { label: "30m before", value: "30m" },
  { label: "1h before", value: "1h" },
];

// Emoji icons for quick selection
const TASK_ICONS = [
  "📝", "💼", "💻", "📚", "🏃", "🧘", "💪", "🍽️", "☕", "🛏️",
  "🎯", "📞", "✉️", "🧹", "🚿", "💊", "🌅", "🌙", "⭐", "❤️",
  "🎨", "🎵", "🎮", "📖", "✍️", "🧠", "💡", "🔥", "🌿", "🙏"
];
 
const CATEGORY_COLORS = {
  health: "bg-green-400",
  work: "bg-blue-400",
  personal: "bg-purple-400",
  ritual: "bg-yellow-400",
};

// Auto-detect time block based on hour
function getTimeBlockFromTime(time: string): TimeBlockType {
  if (!time) return "Morning";
  const [hours] = time.split(":").map(Number);
  if (hours >= 4 && hours < 6) return "Dawn";
  if (hours >= 6 && hours < 12) return "Morning";
  if (hours >= 12 && hours < 14) return "Noon";
  if (hours >= 14 && hours < 17) return "Afternoon";
  if (hours >= 17 && hours < 20) return "Evening";
  return "Night";
}

// Get current day abbreviation
function getCurrentDayAbbr(): string {
  return format(new Date(), "EEE").toUpperCase();
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskToEdit, defaultDay, specificDate }) => {
  const { addTask, updateTask, deleteTask } = useTask();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📝");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeBlock, setTimeBlock] = useState<TimeBlockType>("Morning");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [reminder, setReminder] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const resetForm = () => {
    setTitle("");
    setIcon("📝");
    // Set default start time to current time rounded to nearest 5 minutes
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 5) * 5;
    now.setMinutes(minutes);
    const defaultStartTime = format(now, "HH:mm");
    setStartTime(defaultStartTime);
    setEndTime(""); // Optional - leave empty by default
    setTimeBlock(getTimeBlockFromTime(defaultStartTime));
    setSelectedDays([getCurrentDayAbbr()]); // Default to current day only
    setReminder("");
    setShowIconPicker(false);
  };

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setIcon(taskToEdit.icon);
      setStartTime(taskToEdit.startTime);
      setEndTime(taskToEdit.endTime);
      setTimeBlock(taskToEdit.timeBlock);
      setSelectedDays(taskToEdit.days);
      setReminder(taskToEdit.reminder || "");
    } else {
      // Reset form and use defaultDay if provided
      setTitle("");
      setIcon("📝");
      const now = new Date();
      const minutes = Math.ceil(now.getMinutes() / 5) * 5;
      now.setMinutes(minutes);
      const defaultStartTime = format(now, "HH:mm");
      setStartTime(defaultStartTime);
      setEndTime("");
      setTimeBlock(getTimeBlockFromTime(defaultStartTime));
      setSelectedDays(defaultDay ? [defaultDay] : [getCurrentDayAbbr()]);
      setReminder("");
      setShowIconPicker(false);
    }
  }, [taskToEdit, isOpen, defaultDay]);

  // Auto-detect time block when start time changes
  useEffect(() => {
    if (startTime && !taskToEdit) {
      setTimeBlock(getTimeBlockFromTime(startTime));
    }
  }, [startTime, taskToEdit]);

  const handleSave = () => {
    if (!title || !startTime) return;

    // If end time not provided, default to 1 hour after start
    let finalEndTime = endTime;
    if (!endTime && startTime) {
      const [hours, mins] = startTime.split(":").map(Number);
      const endHour = (hours + 1) % 24;
      finalEndTime = `${endHour.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    }

    const data = {
      title,
      icon,
      startTime,
      endTime: finalEndTime,
      timeBlock,
      days: selectedDays.length > 0 ? selectedDays : [getCurrentDayAbbr()],
      reminder: reminder || undefined,
      specificDate: specificDate || undefined // Save specific date if provided
    };

    if (taskToEdit) {
      updateTask({ ...taskToEdit, ...data });
    } else {
      addTask(data);
    }
    onClose();
  };

  const handleDelete = () => {
    if (taskToEdit) {
      deleteTask(taskToEdit.id);
      onClose();
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectIcon = (selectedIcon: string) => {
    setIcon(selectedIcon);
    setShowIconPicker(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Task" : "Add Task"}
      className="max-w-2xl"
    >
      <div className="space-y-6 py-2">
        {/* Title & Icon Section */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-32 space-y-3 shrink-0">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] italic">Icon</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex h-16 w-full items-center justify-center gap-3 glass-border bg-background/70 text-4xl hover:bg-muted/70 transition-all active:translate-y-1 active:translate-x-1 rounded-2xl backdrop-blur-sm"
              >
                {icon}
                <Smile className="w-5 h-5 text-muted-foreground" />
              </button>
 
              {/* Icon Picker Dropdown */}
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-4 p-6 glass-border bg-background/90 z-50 glass-shadow-lg w-[320px] rounded-3xl backdrop-blur-xl">
                  <div className="grid grid-cols-5 gap-3">
                    {TASK_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => selectIcon(emoji)}
                        className={cn(
                          "h-12 w-12 glass-border text-2xl flex items-center justify-center transition-all hover:bg-primary/20 hover:scale-110 rounded-full backdrop-blur-sm",
                          "font-emoji",
                          icon === emoji ? "bg-primary/90 border-foreground glass-shadow scale-110 -translate-y-1" : "bg-muted/70"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] italic">Task Name</label>
            <Input
              placeholder="What are you planning to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-16 bg-background/70 text-xl font-black uppercase tracking-tight glass-border placeholder:italic rounded-2xl backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Time Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-5 p-6 glass-border bg-muted/30 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-3 text-foreground">
              <Clock className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest italic">Timing</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">From</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="flex h-12 w-full glass-border bg-background/70 px-3 py-2 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-foreground rounded-full backdrop-blur-sm"
                  />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  Until
                  <span className="text-[10px] opacity-40 italic">(optional)</span>
                </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="Optional"
                    className="flex h-12 w-full glass-border bg-background/70 px-3 py-2 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-foreground rounded-full backdrop-blur-sm"
                  />
              </div>
            </div>
            <div className="pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block italic">
                Time Block <span className="text-primary">(Auto-Detected)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_BLOCKS.map(block => (
                  <button
                    key={block}
                    type="button"
                    onClick={() => setTimeBlock(block)}
                    className={cn(
                      "py-2 glass-border text-[10px] font-black uppercase tracking-wider transition-all rounded-full backdrop-blur-sm",
                      timeBlock === block
                        ? "bg-primary/90 border-foreground glass-shadow"
                        : "bg-background/70 border-foreground/30 text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {block}
                  </button>
                ))}
              </div>
            </div>
          </div>
 
          <div className="space-y-5 p-6 glass-border bg-muted/30 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-3 text-foreground">
              <Bell className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest italic">Reminders</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {REMINDERS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReminder(r.value)}
                  className={cn(
                    "py-3 glass-border text-xs font-black uppercase tracking-widest transition-all rounded-full backdrop-blur-sm",
                    reminder === r.value
                      ? "bg-primary/90 border-foreground glass-shadow text-foreground"
                      : "bg-background/70 border-foreground/30 text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Days Selection - HIDDEN if specificDate is set */}
        {!specificDate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3 text-foreground">
                <Calendar className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest italic">Active Days</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground">
                Today: <span className="text-primary">{getCurrentDayAbbr()}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "flex-1 h-14 glass-border text-sm font-black transition-all min-w-[50px] uppercase rounded-2xl backdrop-blur-sm",
                    selectedDays.includes(day)
                      ? "bg-primary/90 border-foreground glass-shadow -translate-y-1"
                      : "bg-background/70 border-foreground text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Specific Date Indicator */}
        {specificDate && (
          <div className="flex items-center gap-4 p-5 glass-border bg-primary/20 border-primary/30 text-foreground rounded-2xl backdrop-blur-sm">
            <Calendar className="w-6 h-6 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.2em] italic">Specific Date</span>
              <span className="text-xl font-black uppercase tracking-tight">{format(new Date(specificDate), "MMMM d, yyyy")}</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t-4 border-foreground/10 mt-4">
          {taskToEdit && (
            <Button
              variant="outline"
              type="button"
              onClick={handleDelete}
              className="h-14 glass-border bg-red-500 text-white hover:bg-red-600 px-6 font-black uppercase italic gap-3 glass-shadow active:translate-x-1 active:translate-y-1 shadow-none rounded-full backdrop-blur-sm"
            >
              <Trash2 className="h-5 w-5" />
              <span className="sm:hidden">Delete</span>
            </Button>
          )}
          {taskToEdit && (
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                // Copy task: clear the taskToEdit reference so it creates a new one
                const copiedData = {
                  title: title + " (Copy)",
                  icon,
                  startTime,
                  endTime,
                  timeBlock,
                  days: selectedDays,
                  reminder: reminder || undefined
                };
                addTask(copiedData);
                onClose();
              }}
              className="h-14 glass-border bg-blue-500 text-white hover:bg-blue-600 px-6 font-black uppercase italic gap-3 glass-shadow active:translate-x-1 active:translate-y-1 shadow-none rounded-full backdrop-blur-sm"
            >
              <Copy className="h-5 w-5" />
              <span className="sm:hidden">Copy</span>
            </Button>
          )}
          <div className="flex-1" />
            <Button
              variant="outline"
              onClick={onClose}
              className="h-14 glass-border bg-background/70 text-foreground hover:bg-muted/70 font-black uppercase italic px-8 transition-all active:translate-x-1 active:translate-y-1 rounded-full backdrop-blur-sm"
            >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title || !startTime}
            className="h-14 glass-border bg-primary/90 text-primary-foreground font-black uppercase italic px-12 glass-shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 rounded-full backdrop-blur-sm"
          >
            {taskToEdit ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export { TaskModal };
