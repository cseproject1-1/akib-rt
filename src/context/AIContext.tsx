"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useTask } from "./TaskContext";
import { useGoal } from "./GoalContext";
import { useAuth } from "./AuthContext";

// ============================================================================
// AI CONTEXT
// ============================================================================
// This context manages the AI assistant state and interactions.

export type AIPlatform = "gemini" | "groq";

interface AIMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    action?: any;
}

interface AIContextType {
    messages: AIMessage[];
    isLoading: boolean;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    sendMessage: (message: string) => Promise<void>;
    clearMessages: () => void;
    getMotivation: () => Promise<string>;
    // Settings
    aiEnabled: boolean;
    setAiEnabled: (enabled: boolean) => void;
    aiPlatform: AIPlatform;
    setAiPlatform: (platform: AIPlatform) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [aiEnabled, setAiEnabledState] = useState(true);
    const [aiPlatform, setAiPlatformState] = useState<AIPlatform>("gemini");
    const { tasks, addTask, toggleTaskCompletion, deleteTask, updateTask } = useTask();
    const { goals, addGoal } = useGoal();
    const { user } = useAuth();

    // Load settings from localStorage on mount
    useEffect(() => {
        try {
            const savedEnabled = localStorage.getItem("ai_enabled");
            const savedPlatform = localStorage.getItem("ai_platform") as AIPlatform;
            if (savedEnabled !== null) {
                setAiEnabledState(savedEnabled === "true");
            }
            if (savedPlatform === "gemini" || savedPlatform === "groq") {
                setAiPlatformState(savedPlatform);
            }
        } catch (e) {
            console.warn("AIContext: LocalStorage access denied", e);
        }
    }, []);

    // Setters that also save to localStorage
    const setAiEnabled = (enabled: boolean) => {
        setAiEnabledState(enabled);
        try {
            localStorage.setItem("ai_enabled", String(enabled));
        } catch (e) { }
    };

    const setAiPlatform = (platform: AIPlatform) => {
        setAiPlatformState(platform);
        try {
            localStorage.setItem("ai_platform", platform);
        } catch (e) { }
    };

    // Get the appropriate API endpoint based on platform
    const getChatEndpoint = () => aiPlatform === "groq" ? "/api/ai/groq-chat" : "/api/ai/chat";
    const getMotivationEndpoint = () => aiPlatform === "groq" ? "/api/ai/groq-motivation" : "/api/ai/motivation";

    // Send a message to the AI
    const sendMessage = useCallback(async (message: string) => {
        if (!message.trim()) return;
        if (!aiEnabled) {
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: "AI is currently disabled. Enable it in Settings to use this feature.",
                timestamp: new Date(),
            }]);
            return;
        }

        // Add user message
        const userMessage: AIMessage = {
            id: Date.now().toString(),
            role: "user",
            content: message,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Include conversation history for context memory
            const conversationHistory = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content,
            }));

            // Get current date from browser for accurate AI responses
            const now = new Date();
            const currentDate = now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            const response = await fetch(getChatEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    currentDate, // Send real-time date from browser
                    context: {
                        tasks: tasks.slice(0, 20), // Send more tasks for better context
                        goals: goals.slice(0, 10),
                    },
                    conversationHistory,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get response");
            }

            // Add AI response
            const aiMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.message,
                timestamp: new Date(),
                action: data.action,
            };
            setMessages((prev) => [...prev, aiMessage]);

            // Handle actions
            if (data.action) {
                if (data.action.action === "CREATE_TASK" && data.action.task) {
                    const task = data.action.task;
                    await addTask({
                        title: task.title,
                        icon: task.icon || "✅",
                        startTime: task.startTime || "09:00",
                        endTime: task.endTime || "10:00",
                        timeBlock: task.timeBlock || "Morning",
                        days: task.days || (task.specificDate ? [] : ["MON", "TUE", "WED", "THU", "FRI"]),
                        specificDate: task.specificDate, // Support calendar-specific dates
                    });
                }
                if (data.action.action === "CREATE_GOAL" && data.action.goal) {
                    const goal = data.action.goal;
                    await addGoal({
                        title: goal.title,
                        description: goal.description || "",
                        targetDate: goal.deadline || goal.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                        category: goal.category || "Personal",
                    });
                }
                if (data.action.action === "COMPLETE_TASK" && data.action.taskId) {
                    await toggleTaskCompletion(data.action.taskId);
                }
                if (data.action.action === "DELETE_TASK" && data.action.taskId) {
                    await deleteTask(data.action.taskId);
                }
                if (data.action.action === "EDIT_TASK" && data.action.taskId && data.action.updates) {
                    const taskToEdit = tasks.find(t => t.id === data.action.taskId);
                    if (taskToEdit) {
                        // Handle date-based updates (specificDate can be added, changed, or removed)
                        const updatedTask = { ...taskToEdit, ...data.action.updates };

                        // If converting from recurring to date-specific, ensure days is empty
                        if (data.action.updates.specificDate && !data.action.updates.days) {
                            updatedTask.days = [];
                        }
                        // If converting from date-specific to recurring, remove specificDate
                        if (data.action.updates.days && data.action.updates.specificDate === null) {
                            delete updatedTask.specificDate;
                        }

                        await updateTask(updatedTask);
                    }
                }
            }
        } catch (error: any) {
            const errorMessage: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Sorry, I encountered an error: ${error.message}. Please make sure the API key is configured.`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [tasks, goals, messages, addTask, addGoal, toggleTaskCompletion, deleteTask, updateTask, aiEnabled, aiPlatform]);

    // Get daily motivation
    const getMotivation = useCallback(async (): Promise<string> => {
        if (!aiEnabled) {
            return "🌟 AI is disabled. Enable it in Settings for personalized motivation!";
        }
        try {
            const todayTasks = tasks.filter((t: { days?: string[] }) => {
                const today = new Date().toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().slice(0, 3);
                return t.days?.includes(today);
            });

            const response = await fetch(getMotivationEndpoint(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tasks: todayTasks.slice(0, 5),
                    userName: user?.displayName || user?.email?.split("@")[0],
                }),
            });

            const data = await response.json();
            return data.motivation;
        } catch (error) {
            return "🌟 You've got this! Every task you complete today brings you closer to your goals!";
        }
    }, [tasks, user, aiEnabled, aiPlatform]);

    // Clear all messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return (
        <AIContext.Provider
            value={{
                messages,
                isLoading,
                isOpen,
                setIsOpen,
                sendMessage,
                clearMessages,
                getMotivation,
                aiEnabled,
                setAiEnabled,
                aiPlatform,
                setAiPlatform,
            }}
        >
            {children}
        </AIContext.Provider>
    );
};

export const useAI = () => {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error("useAI must be used within an AIProvider");
    }
    return context;
};

