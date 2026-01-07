// ============================================================================
// TASK CONTEXT (CORE BUSINESS LOGIC)
// ============================================================================
// This is the heart of the application. It manages everything related to Tasks:
// - Fetching tasks from Firestore (Real-time)
// - Adding, Updating, Deleting tasks
// - Marking tasks as complete (and tracking history)
// - calculating progress, streaks, and completion rates
// - Managing Templates

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Used to generate unique IDs for tasks
import { format, subDays } from "date-fns"; // Date formatting helpers
import { db } from "@/lib/firebase"; // Firestore instance
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  increment,
  getDocs,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { useAuth } from "./AuthContext"; // We need the user to know WHICH tasks to fetch

// 1. DATA TYPES AND INTERFACES
// ----------------------------------------------------------------------------
// We define the structure of our data here.

// TimeBlock: Categorizes when a task should be done.
export type TimeBlock = "Dawn" | "Morning" | "Noon" | "Afternoon" | "Evening" | "Night";

// Task: The main data object.
export interface Task {
  id: string;              // Unique ID (UUID)
  title: string;           // Name of the task
  icon: string;            // Emoji or Icon string
  startTime: string;       // "HH:mm" format (24h)
  endTime: string;         // "HH:mm" format (24h)
  timeBlock: TimeBlock;    // The section of the day it belongs to
  days: string[];          // Days of the week this task repeats ["MON", "WED", etc.]

  // COMPLETION LOGIC:
  // 'isCompleted' is a boolean for the "Current View" (usually today).
  // It is computed or reset based on completionHistory.
  isCompleted: boolean;

  // 'lastCompletedDate' helps us quickly check if it was done today without parsing arrays.
  lastCompletedDate?: string; // ISO date string

  // 'completionHistory' is the source of truth for streaks and past records.
  // It is an array of "YYYY-MM-DD" strings representing every day this task was finished.
  completionHistory: string[];

  // Optional: For single-date tasks (calendar-specific), this overrides 'days' filtering
  specificDate?: string;   // "YYYY-MM-DD" format - task only shows on this exact date

  reminder?: string;       // Optional reminder setting e.g. "5m", "15m", "1h"
}

// Context Interface: methods and data exposed to the app.
interface TaskContextType {
  tasks: Task[];
  // Actions
  addTask: (task: Omit<Task, "id" | "isCompleted" | "completionHistory">) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  resetDay: () => Promise<void>; // Manually resets "isCompleted" for a new day if needed

  // Data Access
  getTasksByTimeBlock: (block: TimeBlock, day?: string) => Task[];

  // Stats
  dailyProgress: number;      // 0-100%
  totalTasksToday: number;
  completedTasksToday: number;

  // State
  selectedDay: string;        // "MON", "TUE", etc. being viewed
  setSelectedDay: (day: string) => void;
  todayDate: Date;

  // Templates
  saveAsTemplate: (name: string) => Promise<void>;
  applyTemplate: (templateName: string) => Promise<void>;
  templates: Record<string, Task[]>;
  replaceAllTasks: (newTasks: Task[]) => Promise<void>;

  // Advanced Stats
  calculateStreak: (task: Task) => number;
  getCompletionRate: (days?: number) => number;

  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// 2. PROVIDER COMPONENT
// ----------------------------------------------------------------------------
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Local State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), "EEE").toUpperCase());
  const [todayDate] = useState<Date>(new Date());
  const [templates, setTemplates] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);

  // 3. FIRESTORE REAL-TIME LISTENERS
  // ----------------------------------------------------------------------------
  // This effect subscribes to the user's "tasks" and "templates" collections.
  // Any change in the DB (cloud) instantly reflects here (local state).
  useEffect(() => {
    // If no user is logged in, clear data and stop loading.
    if (!user) {
      setTasks([]);
      setTemplates({});
      setLoading(false);
      return;
    }

    // LOAD FROM CACHE FIRST (Offline Support)
    try {
      const cachedTasks = localStorage.getItem(`rt_tasks_${user.uid}`);
      const cachedTemplates = localStorage.getItem(`rt_templates_${user.uid}`);
      if (cachedTasks) setTasks(JSON.parse(cachedTasks));
      if (cachedTemplates) setTemplates(JSON.parse(cachedTemplates));
    } catch (e) {
      console.warn("Failed to load cached tasks");
    }

    // References to the Firestore collections
    const tasksRef = collection(db, "users", user.uid, "tasks");
    const templatesRef = collection(db, "users", user.uid, "templates");

    // Listener 1: Tasks
    const unsubscribeTasks = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks);
      setLoading(false);

      // Update Cache
      try {
        localStorage.setItem(`rt_tasks_${user.uid}`, JSON.stringify(fetchedTasks));
      } catch (e) { }

    }, (error) => {
      console.error("Firestore Tasks Error:", error);
      // If offline, we keep the cached data and just stop loading
      setLoading(false);
    });

    // Listener 2: Templates
    const unsubscribeTemplates = onSnapshot(templatesRef, (snapshot) => {
      const fetchedTemplates: Record<string, Task[]> = {};
      snapshot.docs.forEach(doc => {
        fetchedTemplates[doc.id] = doc.data().tasks as Task[];
      });
      setTemplates(fetchedTemplates);

      // Update Cache
      try {
        localStorage.setItem(`rt_templates_${user.uid}`, JSON.stringify(fetchedTemplates));
      } catch (e) { }
    }, (error) => {
      console.error("Firestore Templates Error:", error);
    });

    // Cleanup listeners on unmount or user change
    return () => {
      unsubscribeTasks();
      unsubscribeTemplates();
    };
  }, [user]);

  // 4. CRUD OPERATIONS
  // ----------------------------------------------------------------------------

  // ADD TASK
  const addTask = async (taskData: Omit<Task, "id" | "isCompleted" | "completionHistory">) => {
    if (!user) return;

    // Create new task object
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),      // Generate a client-side ID
      isCompleted: false,
      completionHistory: []
    };

    // Sanitize: Firestore does not allow 'undefined' values.
    // We create a clean object for Firestore.
    const firestoreData = { ...newTask };
    if (firestoreData.reminder === undefined) {
      delete firestoreData.reminder;
    }

    try {
      await setDoc(doc(db, "users", user.uid, "tasks", newTask.id), firestoreData);
    } catch (error: any) {
      console.error("Failed to add task:", error);
      if (error.code === "permission-denied") {
        alert("⚠️ Firestore Permission Denied!\n\nPlease update your Firebase security rules:\n1. Go to Firebase Console → Firestore → Rules\n2. Add the rules from firestore.rules file\n3. Click Publish");
      } else {
        alert(`Failed to save task: ${error.message}`);
      }
    }
  };

  // UPDATE TASK
  const updateTask = async (updatedTask: Task) => {
    if (!user) return;

    // Sanitize data
    const dataToSave = { ...updatedTask };
    if (dataToSave.reminder === undefined) {
      delete dataToSave.reminder;
    }

    // Overwrite the document with new data
    try {
      await updateDoc(doc(db, "users", user.uid, "tasks", updatedTask.id), dataToSave);
    } catch (error: any) {
      console.error("Failed to update task:", error);
      alert(`Failed to update task: ${error.message}`);
    }
  };

  // DELETE TASK
  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "tasks", id));
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      alert(`Failed to delete task: ${error.message}`);
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const isCurrentlyCompleted = task.completionHistory.includes(todayStr);

    // 1. Calculate the NEW history for this task
    const newHistory = isCurrentlyCompleted
      ? task.completionHistory.filter((d) => d !== todayStr)
      : [...task.completionHistory, todayStr];

    const updates = {
      completionHistory: newHistory,
      isCompleted: !isCurrentlyCompleted,
      lastCompletedDate: !isCurrentlyCompleted ? new Date().toISOString() : null,
    };

    // 2. Simulate the new state of ALL tasks to calculate global stats
    const simulatedTasks = tasks.map(t =>
      t.id === id ? { ...t, completionHistory: newHistory } : t
    );

    // --- HELPER: Calculate Global Stats ---
    const calculateGlobalStats = (currentTasks: Task[]) => {
      // A. Total Completed (All time)
      const totalCompleted = currentTasks.reduce((acc, t) => acc + t.completionHistory.length, 0);

      // B. Completion Rate (Last 7 Days)
      let scheduled = 0;
      let completed = 0;
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const dateToCheck = subDays(today, i);
        const dateStr = format(dateToCheck, "yyyy-MM-dd");
        const dayName = format(dateToCheck, "EEE").toUpperCase();

        currentTasks.forEach(t => {
          // Check if scheduled (handling specificDate override vs regular days)
          const isScheduled = t.specificDate
            ? t.specificDate === dateStr
            : t.days.includes(dayName);

          if (isScheduled) {
            scheduled++;
            if (t.completionHistory.includes(dateStr)) completed++;
          }
        });
      }
      const completionRate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

      // C. Global Streak (Consecutive days with at least 1 completed task)
      let streak = 0;
      // Check last 365 days
      for (let i = 0; i < 365; i++) {
        const dateToCheck = subDays(today, i);
        const dateStr = format(dateToCheck, "yyyy-MM-dd");

        // Did we complete ANY task on this date?
        const anyTaskDone = currentTasks.some(t => t.completionHistory.includes(dateStr));

        if (anyTaskDone) {
          streak++;
        } else {
          // If it's today (i=0) and we haven't done anything yet, it doesn't break the streak from yesterday.
          // Examples:
          // - Done yesterday, done today => streak 2
          // - Done yesterday, NOT done today => streak 1 (still active)
          // - NOT done yesterday => streak 0 (broken)
          if (i === 0) continue;
          break;
        }
      }
      return { totalCompleted, completionRate, streak };
    };

    const stats = calculateGlobalStats(simulatedTasks);

    try {
      const batch = writeBatch(db);

      // 3. Queue Update for the Task
      const taskRef = doc(db, "users", user.uid, "tasks", id);
      batch.update(taskRef, updates as unknown as Partial<Task>);

      // 4. Queue Update for User Stats (Leaderboard)
      const userRef = doc(db, "users", user.uid);
      const scoreChange = !isCurrentlyCompleted ? 10 : -10;

      batch.set(userRef, {
        score: increment(scoreChange),
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL,
        // New Leaderboard Stats
        totalCompleted: stats.totalCompleted,
        completionRate: stats.completionRate,
        streak: stats.streak,
        lastActive: new Date().toISOString()
      }, { merge: true });

      await batch.commit();

    } catch (error: any) {
      console.error("Failed to toggle completion:", error);
      if (error.code === "permission-denied") {
        alert("⚠️ Firestore Permission Denied!\n\nPlease update your Firebase permissions.");
      } else {
        alert(`Failed to update task status: ${error.message}`);
      }
    }
  };

  // RESET DAY (Maintenance)
  // Could be called at midnight or on app load to ensure 'isCompleted' is false for a new day.
  const resetDay = async () => {
    if (!user) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const batch = writeBatch(db); // Use batch for atomic multiple updates

    tasks.forEach(t => {
      // Logic: Ensure 'completionHistory' doesn't contain future dates (sanity check)
      // and reset 'isCompleted' if it's a new day and we haven't done it yet.
      // (Simplified logic here primarily checks consistency)
      const newHistory = t.completionHistory.filter(d => d !== todayStr);

      // If we need to "uncheck" everything for a fresh start (sanity check logic)
      if (newHistory.length !== t.completionHistory.length || t.isCompleted) {
        const ref = doc(db, "users", user.uid, "tasks", t.id);
        batch.update(ref, {
          isCompleted: false,
          lastCompletedDate: null,
          completionHistory: newHistory
        });
      }
    });

    await batch.commit();
  };

  // 6. QUERY HELPERS
  // ----------------------------------------------------------------------------

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

  // Filter tasks by "Morning", "Evening" etc. and specific day "MON"
  // IMPORTANT FIX: Compute isCompleted based on the selectedDay's date, not the global flag.
  const getTasksByTimeBlock = (block: TimeBlock, day: string = selectedDay) => {
    const dateStrForDay = getDateForDayOfWeek(day);
    return tasks
      .filter((t) => {
        // If task has specificDate, it only shows on that exact date
        if (t.specificDate) {
          return t.timeBlock === block && t.specificDate === dateStrForDay;
        }
        // Otherwise, standard recurring day check
        return t.timeBlock === block && t.days.includes(day);
      })
      .map((t) => ({
        ...t,
        // Dynamically compute isCompleted for the currently viewed day
        isCompleted: t.completionHistory.includes(dateStrForDay)
      }))
      // Sort by startTime (chronological order within the block)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Calculate Progress for the "Selected Day"
  const dateStrForSelectedDay = getDateForDayOfWeek(selectedDay);
  const todaysTasks = tasks
    .filter((t) => t.days.includes(selectedDay))
    .map((t) => ({
      ...t,
      isCompleted: t.completionHistory.includes(dateStrForSelectedDay)
    }));
  const totalTasksToday = todaysTasks.length;
  const completedTasksToday = todaysTasks.filter((t) => t.isCompleted).length;

  const dailyProgress = totalTasksToday > 0
    ? Math.round((completedTasksToday / totalTasksToday) * 100)
    : 0;

  // 7. TEMPLATE LOGIC
  // ----------------------------------------------------------------------------
  const sanitizeTasks = (tasksToSanitize: Task[]) => {
    return tasksToSanitize.map(t => {
      const sanitized = { ...t };
      if (sanitized.reminder === undefined) delete sanitized.reminder;
      if (sanitized.lastCompletedDate === undefined) delete sanitized.lastCompletedDate;
      return sanitized;
    });
  };

  const saveAsTemplate = async (name: string) => {
    if (!user) return;
    try {
      const sanitizedTasks = sanitizeTasks(tasks);
      await setDoc(doc(db, "users", user.uid, "templates", name), { tasks: sanitizedTasks });
      alert("Template saved successfully!");
    } catch (error: any) {
      console.error("Failed to save template:", error);
      alert(`Failed to save template: ${error.message}`);
    }
  };

  const replaceAllTasks = async (newTasks: Task[]) => {
    if (!user) return;
    const batch = writeBatch(db);

    // 1. Delete all current tasks
    tasks.forEach(t => {
      batch.delete(doc(db, "users", user.uid, "tasks", t.id));
    });

    // 2. Add new tasks from the template
    sanitizeTasks(newTasks).forEach(t => {
      batch.set(doc(db, "users", user.uid, "tasks", t.id), t);
    });

    try {
      await batch.commit();
    } catch (error: any) {
      console.error("Failed to apply template:", error);
      alert(`Failed to apply template: ${error.message}`);
    }
  };

  const applyTemplate = async (templateName: string) => {
    if (!user || !templates[templateName]) return;

    // Clone tasks from template and give them fresh IDs
    const newTasks = templates[templateName].map(t => ({
      ...t,
      id: uuidv4(),
      isCompleted: false,
      lastCompletedDate: undefined,
      completionHistory: [] // Fresh history for new routine
    }));

    await replaceAllTasks(newTasks);
  };

  // 8. STATS & REWARDS LOGIC
  // ----------------------------------------------------------------------------

  // Calculate Streak: Consecutive days (going backwards from today) that the task was done.
  const calculateStreak = (task: Task): number => {
    let streak = 0;
    const today = new Date();
    // Check last 365 days
    for (let i = 0; i < 365; i++) {
      const dateToCheck = subDays(today, i);
      const dateStr = format(dateToCheck, "yyyy-MM-dd");
      const dayName = format(dateToCheck, "EEE").toUpperCase();

      // If the task wasn't scheduled for this day, skip it (doesn't break streak)
      if (!task.days.includes(dayName)) continue;

      // If it WAS scheduled and DONE:
      if (task.completionHistory.includes(dateStr)) {
        streak++;
      } else {
        // If it was today and we haven't done it yet, it doesn't break streak *yet*
        // But for "current streak", usually we count up to yesterday unless today is done.
        // Simple logic: if i==0 (today) and not done, continue. If i>0 and not done, BREAK.
        if (i === 0) continue;
        break; // Streak broken
      }
    }
    return streak;
  };

  // Completion Rate: % of scheduled tasks completed in the last X days.
  const getCompletionRate = (days: number = 7): number => {
    if (tasks.length === 0) return 0;
    let totalScheduled = 0;
    let totalCompleted = 0;
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const dateToCheck = subDays(today, i);
      const dateStr = format(dateToCheck, "yyyy-MM-dd");
      const dayName = format(dateToCheck, "EEE").toUpperCase();

      tasks.forEach(task => {
        // Was the task scheduled for this day?
        if (task.days.includes(dayName)) {
          totalScheduled++;
          // Was it done?
          if (task.completionHistory.includes(dateStr)) {
            totalCompleted++;
          }
        }
      });
    }

    return totalScheduled === 0 ? 0 : Math.round((totalCompleted / totalScheduled) * 100);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        resetDay,
        getTasksByTimeBlock,
        dailyProgress,
        totalTasksToday,
        completedTasksToday,
        selectedDay,
        setSelectedDay,
        todayDate,
        saveAsTemplate,
        applyTemplate,
        templates,
        replaceAllTasks,
        calculateStreak,
        getCompletionRate,
        loading
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
