// ============================================================================
// USE FOCUS TIMER HOOK (Enhanced with Firestore, Presets, Distraction Tracking)
// ============================================================================
// This custom hook manages the Pomodoro-style timer with advanced features:
// - Firestore persistence for cross-device sync
// - Multiple presets (Classic, Deep Work, Sprint, Custom)
// - Distraction tracking (window blur/focus events)
// - Session abandonment detection and resume
// - Real-time stats integration
// - Background mode (document.title updates)
// - Quick notes capture
// - Task linkage with auto-completion

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  createFocusSession,
  updateFocusSession,
  completeFocusSession,
  getIncompleteSession,
  getTodayFocusStats,
  FocusSession,
} from "@/lib/focusSessionUtils";
import type { FocusPresetId, FocusPresetConfig } from "@/components/focus/PresetSelector";
import { PRESET_CONFIGS } from "@/components/focus/PresetSelector";
import { Timestamp } from "firebase/firestore";

export const useFocusTimer = () => {
  const { user } = useAuth();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Timer State
  const [sessionType, setSessionType] = useState<
    "focus" | "shortBreak" | "longBreak"
  >("focus");
  const [currentPreset, setCurrentPreset] = useState<FocusPresetId>("classic");
  const [presetConfig, setPresetConfig] = useState<FocusPresetConfig>(
    PRESET_CONFIGS[0]
  );

  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Session Data
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedTaskTitle, setLinkedTaskTitle] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");

  // Stats State
  const [todayStats, setTodayStats] = useState({ minutes: 0, sessions: 0 });

  // Distraction Tracking
  const [blurStartTime, setBlurStartTime] = useState<number | null>(null);
  const [totalBlurTime, setTotalBlurTime] = useState(0);
  const [blurCount, setBlurCount] = useState(0);
  const [previousAverageFocus, setPreviousAverageFocus] = useState(100);

  // Session Report
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [lastSessionData, setLastSessionData] = useState<any>(null);

  // Resume Session Dialog
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [incompleteSession, setIncompleteSession] = useState<FocusSession | null>(null);

  // References
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<number>(Date.now());
  const timerStartTime = useRef<number>(Date.now());
  const targetEndTime = useRef<number>(Date.now());
  const hasLoadedFromStorage = useRef(false);

  // ============================================================================
  // LOCALSTORAGE PERSISTENCE
  // ============================================================================

  // Load timer state from localStorage on mount
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;
    hasLoadedFromStorage.current = true;

    try {
      const savedState = localStorage.getItem('focus_timer_state');
      if (savedState) {
        const state = JSON.parse(savedState);

        // Only restore if timer was active and not too old (max 24 hours)
        if (state.isActive && state.targetEndTime) {
          const now = Date.now();
          const timeSinceSaved = now - state.savedAt;

          if (timeSinceSaved < 24 * 60 * 60 * 1000) { // 24 hours
            const remaining = Math.max(0, state.targetEndTime - now);

            if (remaining > 0) {
              // Timer still has time left - restore it
              const remainingSeconds = Math.ceil(remaining / 1000);
              const newMinutes = Math.floor(remainingSeconds / 60);
              const newSeconds = remainingSeconds % 60;

              setMinutes(newMinutes);
              setSeconds(newSeconds);
              setIsActive(true);
              setIsPaused(state.isPaused || false);
              setSessionType(state.sessionType || 'focus');
              setTotalSeconds(state.totalSeconds || remainingSeconds);

              // Restore refs
              targetEndTime.current = state.targetEndTime;
              timerStartTime.current = state.timerStartTime || now;
              sessionStartTime.current = state.sessionStartTime || now;

              // Restore session data
              if (state.currentSessionId) setCurrentSessionId(state.currentSessionId);
              if (state.linkedTaskId) setLinkedTaskId(state.linkedTaskId);
              if (state.linkedTaskTitle) setLinkedTaskTitle(state.linkedTaskTitle);
              if (state.sessionNotes) setSessionNotes(state.sessionNotes);
              if (state.totalBlurTime) setTotalBlurTime(state.totalBlurTime);
              if (state.blurCount) setBlurCount(state.blurCount);
            } else {
              // Timer expired while page was closed - clear storage
              localStorage.removeItem('focus_timer_state');
            }
          } else {
            // State too old - clear it
            localStorage.removeItem('focus_timer_state');
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore timer state:', error);
      localStorage.removeItem('focus_timer_state');
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return; // Don't save until we've loaded

    if (isActive) {
      const state = {
        isActive,
        isPaused,
        sessionType,
        minutes,
        seconds,
        totalSeconds,
        targetEndTime: targetEndTime.current,
        timerStartTime: timerStartTime.current,
        sessionStartTime: sessionStartTime.current,
        currentSessionId,
        linkedTaskId,
        linkedTaskTitle,
        sessionNotes,
        totalBlurTime,
        blurCount,
        savedAt: Date.now(),
      };

      try {
        localStorage.setItem('focus_timer_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save timer state:', error);
      }
    } else {
      // Timer not active - clear storage
      localStorage.removeItem('focus_timer_state');
    }
  }, [isActive, isPaused, minutes, seconds, sessionType, totalSeconds, currentSessionId, linkedTaskId, linkedTaskTitle, sessionNotes, totalBlurTime, blurCount]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Load today's stats and check for incomplete sessions
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      try {
        // Load today's stats
        const stats = await getTodayFocusStats(user.uid);
        setTodayStats(stats);

        // Check for incomplete session
        const incomplete = await getIncompleteSession(user.uid);
        if (incomplete) {
          setIncompleteSession(incomplete);
          setShowResumeDialog(true);
        }
      } catch (error) {
        console.error("Failed to load focus data:", error);
      }
    };

    loadInitialData();
  }, [user]);

  // ============================================================================
  // DISTRACTION TRACKING
  // ============================================================================

  useEffect(() => {
    if (!isActive || isPaused) return;

    const handleBlur = () => {
      setBlurStartTime(Date.now());
      setBlurCount((prev) => prev + 1);
    };

    const handleFocus = () => {
      if (blurStartTime) {
        const blurDuration = (Date.now() - blurStartTime) / 1000; // seconds
        setTotalBlurTime((prev) => prev + blurDuration);
        setBlurStartTime(null);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isActive, isPaused, blurStartTime]);

  // ============================================================================
  // BACKGROUND MODE (Document Title Updates)
  // ============================================================================

  useEffect(() => {
    if (isActive && !isPaused) {
      const time = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      document.title = `[${time}] Focus Engine - RT`;
    } else {
      document.title = "RT - Routine Tracker";
    }

    return () => {
      document.title = "RT - Routine Tracker";
    };
  }, [isActive, isPaused, minutes, seconds]);

  // ============================================================================
  // TIMER LOGIC (TIMESTAMP-BASED FOR ACCURACY IN BACKGROUND)
  // ============================================================================

  useEffect(() => {
    if (isActive && !isPaused) {
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = now - timerStartTime.current;
        const remaining = Math.max(0, targetEndTime.current - now);

        const remainingSeconds = Math.ceil(remaining / 1000);
        const newMinutes = Math.floor(remainingSeconds / 60);
        const newSeconds = remainingSeconds % 60;

        setMinutes(newMinutes);
        setSeconds(newSeconds);

        // Check if timer finished
        if (remaining <= 0) {
          handleSessionComplete();
        }
      };

      // Update immediately
      updateTimer();

      // Update every 100ms for smooth display
      intervalRef.current = setInterval(updateTimer, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused]);

  // Handle visibility change to sync timer when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive && !isPaused) {
        // Force update when tab becomes visible again
        const now = Date.now();
        const remaining = Math.max(0, targetEndTime.current - now);
        const remainingSeconds = Math.ceil(remaining / 1000);
        const newMinutes = Math.floor(remainingSeconds / 60);
        const newSeconds = remainingSeconds % 60;

        setMinutes(newMinutes);
        setSeconds(newSeconds);

        if (remaining <= 0) {
          handleSessionComplete();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive, isPaused]);

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  const handleSessionComplete = async () => {
    clearInterval(intervalRef.current as NodeJS.Timeout);
    setIsActive(false);

    if (!user || !currentSessionId) return;

    try {
      // Calculate focus metrics
      const sessionDuration = (Date.now() - sessionStartTime.current) / 1000; // seconds
      const focusPercentage = Math.max(
        0,
        Math.min(100, ((sessionDuration - totalBlurTime) / sessionDuration) * 100)
      );
      const isPerfectFocus = focusPercentage === 100;

      const distractionData = {
        totalBlurTime: Math.round(totalBlurTime),
        blurCount,
        focusPercentage: Math.round(focusPercentage),
        isPerfectFocus,
      };

      // Complete session in Firestore
      await completeFocusSession(user.uid, currentSessionId, {
        completed: true,
        distractions: distractionData,
        notes: sessionNotes || undefined,
      });

      // Update stats
      const newStats = await getTodayFocusStats(user.uid);
      setTodayStats(newStats);

      // Show session report
      setLastSessionData({
        duration: presetConfig.focusMinutes,
        taskTitle: linkedTaskTitle,
        focusPercentage: Math.round(focusPercentage),
        previousAverage: previousAverageFocus,
        isPerfectFocus,
        distractionCount: blurCount,
        totalDistractTime: Math.round(totalBlurTime),
      });
      setShowSessionReport(true);

      // Reset distraction tracking
      setTotalBlurTime(0);
      setBlurCount(0);
      setSessionNotes("");

      // Browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("RT - Focus Timer", {
          body: `${sessionType === "focus" ? "Focus session" : "Break"} complete! ${isPerfectFocus ? "🌟 Perfect Focus!" : ""}`,
        });
      }
    } catch (error) {
      console.error("Failed to complete session:", error);
    }

    setCurrentSessionId(null);
  };

  // ============================================================================
  // CONTROL FUNCTIONS
  // ============================================================================

  const toggleTimer = async () => {
    if (!isActive) {
      // Starting a new session
      setIsActive(true);
      setIsPaused(false);

      // Set timestamp references for accurate timing
      const now = Date.now();
      sessionStartTime.current = now;
      timerStartTime.current = now;
      targetEndTime.current = now + (minutes * 60 + seconds) * 1000;

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      // Create session in Firestore (only for focus sessions)
      if (user && sessionType === "focus") {
        try {
          const sessionId = await createFocusSession(user.uid, {
            sessionType,
            duration: presetConfig.focusMinutes,
            preset: currentPreset,
            linkedTaskId: linkedTaskId || undefined,
            linkedTaskTitle: linkedTaskTitle || undefined,
          });
          setCurrentSessionId(sessionId);
        } catch (error) {
          console.error("Failed to create session:", error);
        }
      }
    } else {
      // Pause/Resume
      if (!isPaused) {
        // Pausing - save current state
        setIsPaused(true);
        setBlurStartTime(Date.now());
        setBlurCount((prev) => prev + 1);
      } else {
        // Resuming - recalculate target end time
        setIsPaused(false);
        const now = Date.now();
        targetEndTime.current = now + (minutes * 60 + seconds) * 1000;

        // Close blur tracking
        if (blurStartTime) {
          const blurDuration = (Date.now() - blurStartTime) / 1000;
          setTotalBlurTime((prev) => prev + blurDuration);
          setBlurStartTime(null);
        }
      }
    }
  };

  const resetTimer = async () => {
    // If there's an active session, mark it as abandoned
    if (user && currentSessionId && isActive) {
      try {
        await updateFocusSession(user.uid, currentSessionId, {
          abandoned: true,
          completed: false,
        });
      } catch (error) {
        console.error("Failed to mark session as abandoned:", error);
      }
    }

    setIsActive(false);
    setIsPaused(false);
    setCurrentSessionId(null);

    const mins = getDurationForSessionType(sessionType);
    setMinutes(mins);
    setSeconds(0);
    setTotalSeconds(mins * 60);

    // Reset distraction tracking
    setTotalBlurTime(0);
    setBlurCount(0);
    setBlurStartTime(null);
  };

  const getDurationForSessionType = (type: "focus" | "shortBreak" | "longBreak"): number => {
    switch (type) {
      case "focus":
        return presetConfig.focusMinutes;
      case "shortBreak":
        return presetConfig.shortBreakMinutes;
      case "longBreak":
        return presetConfig.longBreakMinutes;
    }
  };

  const setSession = (type: "focus" | "shortBreak" | "longBreak") => {
    setSessionType(type);
    setIsActive(false);
    setIsPaused(false);
    const mins = getDurationForSessionType(type);
    setMinutes(mins);
    setSeconds(0);
    setTotalSeconds(mins * 60);
  };

  // ============================================================================
  // PRESET MANAGEMENT
  // ============================================================================

  const changePreset = (presetId: FocusPresetId, config: FocusPresetConfig) => {
    if (isActive) return; // Don't allow changing presets during active session

    setCurrentPreset(presetId);
    setPresetConfig(config);

    // Update timer with new duration
    const mins = getDurationForSessionType(sessionType);
    setMinutes(mins);
    setSeconds(0);
    setTotalSeconds(mins * 60);
  };

  // ============================================================================
  // TASK LINKAGE
  // ============================================================================

  const linkTask = (taskId: string, taskTitle: string) => {
    setLinkedTaskId(taskId);
    setLinkedTaskTitle(taskTitle);
  };

  const unlinkTask = () => {
    setLinkedTaskId(null);
    setLinkedTaskTitle(null);
  };

  // ============================================================================
  // RESUME SESSION
  // ============================================================================

  const resumeSession = useCallback(() => {
    if (!incompleteSession) return;

    // Calculate remaining time
    const elapsed = Date.now() - incompleteSession.startTime.toMillis();
    const totalDuration = incompleteSession.duration * 60 * 1000; // milliseconds
    const remaining = Math.max(0, totalDuration - elapsed);

    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);

    setMinutes(remainingMinutes);
    setSeconds(remainingSeconds);
    setSessionType(incompleteSession.sessionType);
    setCurrentSessionId(incompleteSession.id);
    setLinkedTaskId(incompleteSession.linkedTaskId || null);
    setLinkedTaskTitle(incompleteSession.linkedTaskTitle || null);

    setShowResumeDialog(false);
    setIncompleteSession(null);
  }, [incompleteSession]);

  const discardIncompleteSession = useCallback(async () => {
    if (!user || !incompleteSession) return;

    try {
      await updateFocusSession(user.uid, incompleteSession.id, {
        abandoned: true,
        completed: false,
      });
    } catch (error) {
      console.error("Failed to discard session:", error);
    }

    setShowResumeDialog(false);
    setIncompleteSession(null);
  }, [user, incompleteSession]);

  // ============================================================================
  // RETURN VALUES
  // ============================================================================

  return {
    // Timer State
    minutes,
    seconds,
    isActive,
    isPaused,
    sessionType,
    totalSeconds,

    // Controls
    toggleTimer,
    resetTimer,
    setSession,

    // Stats
    todayStats,

    // Preset Management
    currentPreset,
    presetConfig,
    changePreset,

    // Task Linkage
    linkedTaskId,
    linkedTaskTitle,
    linkTask,
    unlinkTask,

    // Session Notes
    sessionNotes,
    setSessionNotes,

    // Distraction Tracking
    totalBlurTime,
    blurCount,
    focusPercentage: isActive
      ? Math.round(
        ((Date.now() - sessionStartTime.current) / 1000 - totalBlurTime) /
        ((Date.now() - sessionStartTime.current) / 1000) *
        100
      )
      : 100,

    // Session Report
    showSessionReport,
    setShowSessionReport,
    lastSessionData,

    // Resume Dialog
    showResumeDialog,
    setShowResumeDialog,
    incompleteSession,
    resumeSession,
    discardIncompleteSession,
  };
};
