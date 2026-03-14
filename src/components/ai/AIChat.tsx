"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAI } from "@/context/AIContext";
import { Bot, X, Send, Sparkles, Trash2, Loader2, Upload, Copy, Check, Maximize2, Minimize2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScheduleUploader } from "./ScheduleUploader";

// Simple markdown-like rendering for bold, italic, lists
const renderMarkdown = (text: string) => {
    // Remove JSON blocks
    let clean = text.replace(/```json[\s\S]*?```/g, "").trim();

    // Bold: **text**
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    clean = clean.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Bullet points: - item or * item
    clean = clean.replace(/^[-*]\s+(.*)$/gm, '• $1');

    // Numbered lists: 1. item
    clean = clean.replace(/^\d+\.\s+(.*)$/gm, '→ $1');

    return clean;
};

// Format relative time
const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
};

export const AIChat: React.FC = () => {
    const { messages, isLoading, isOpen, setIsOpen, sendMessage, clearMessages, aiEnabled } = useAI();

    if (!aiEnabled) return null;

    const [input, setInput] = useState("");
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [reactions, setReactions] = useState<Record<string, "up" | "down" | null>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput("");
        }
    };

    const handleCopy = async (text: string, id: string) => {
        const cleanText = text.replace(/```json[\s\S]*?```/g, "").trim();
        await navigator.clipboard.writeText(cleanText);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleReaction = (id: string, type: "up" | "down") => {
        setReactions(prev => ({
            ...prev,
            [id]: prev[id] === type ? null : type
        }));
    };

    // Get action label
    const getActionLabel = (action: any) => {
        switch (action?.action) {
            case "CREATE_TASK": return "✅ Task created!";
            case "CREATE_GOAL": return "🎯 Goal created!";
            case "DELETE_TASK": return "🗑️ Task deleted!";
            case "EDIT_TASK": return "✏️ Task updated!";
            case "COMPLETE_TASK": return "☑️ Task completed!";
            default: return "✨ Action completed!";
        }
    };

    // Quick actions
    const quickActions = [
        { label: "➕ Add Task", prompt: "Create a task to " },
        { label: "🎯 Set Goal", prompt: "Create a goal to " },
        { label: "📅 Schedule Date", prompt: "Schedule a task on " },
        { label: "🔄 Reschedule", prompt: "Move my task to " },
        { label: "✏️ Edit Task", prompt: "Change the time of " },
        { label: "🗑️ Delete Task", prompt: "Delete the task called " },
        { label: "💪 Motivate", prompt: "Give me motivation for my tasks today" },
    ];

    // Size classes
    const sizeClasses = isFullscreen
        ? "fixed inset-4 z-50 rounded-3xl"
        : "fixed bottom-6 right-6 z-50 h-[550px] w-[420px] rounded-3xl";

    if (!isOpen) {
        return (
            <>
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-purple-500/40"
                    aria-label="Open AI Assistant"
                >
                    <Bot className="h-6 w-6" />
                </button>
                <ScheduleUploader isOpen={isUploaderOpen} onClose={() => setIsUploaderOpen(false)} />
            </>
        );
    }

    return (
        <>
            <div className={`${sizeClasses} flex flex-col overflow-hidden border border-white/10 bg-background/95 shadow-2xl shadow-purple-500/10 backdrop-blur-xl`}>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">RT AI</h3>
                            <p className="text-xs text-muted-foreground">
                                {isLoading ? (
                                    <span className="flex items-center gap-1">
                                        <span className="animate-pulse">typing</span>
                                        <span className="flex gap-0.5">
                                            <span className="animate-bounce delay-0">.</span>
                                            <span className="animate-bounce delay-100">.</span>
                                            <span className="animate-bounce delay-200">.</span>
                                        </span>
                                    </span>
                                ) : "Your productivity assistant"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsUploaderOpen(true)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Import schedule from image"
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearMessages}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Clear chat"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                                <Bot className="h-8 w-8 text-purple-400" />
                            </div>
                            <h4 className="text-sm font-bold text-foreground mb-2">Hi! I'm RT AI 🌟</h4>
                            <p className="text-xs text-muted-foreground mb-4">
                                I can create, edit, delete tasks, schedule on specific dates, set goals, and motivate you!
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {quickActions.map((action) => (
                                    <button
                                        key={action.label}
                                        onClick={() => setInput(action.prompt)}
                                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsUploaderOpen(true)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors flex items-center gap-1"
                                >
                                    <Upload className="h-3 w-3" />
                                    Upload Schedule
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[85%] ${msg.role === "user" ? "" : "group"}`}>
                                <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user"
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                        : "bg-muted/50 border border-border text-foreground"
                                        }`}
                                >
                                    <p
                                        className="whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                    />
                                    {msg.action && (
                                        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-purple-400 font-medium">
                                            {getActionLabel(msg.action)}
                                        </div>
                                    )}
                                </div>

                                {/* Message footer: timestamp + actions */}
                                <div className={`flex items-center gap-2 mt-1 px-1 ${msg.role === "user" ? "justify-end" : "opacity-0 group-hover:opacity-100 transition-opacity"}`}>
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatTime(msg.timestamp)}
                                    </span>
                                    {msg.role === "assistant" && (
                                        <>
                                            <button
                                                onClick={() => handleCopy(msg.content, msg.id)}
                                                className="p-1 rounded hover:bg-muted"
                                                title="Copy"
                                            >
                                                {copiedId === msg.id ? (
                                                    <Check className="h-3 w-3 text-green-400" />
                                                ) : (
                                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleReaction(msg.id, "up")}
                                                className={`p-1 rounded hover:bg-muted ${reactions[msg.id] === "up" ? "text-green-400" : "text-muted-foreground"}`}
                                                title="Helpful"
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                onClick={() => handleReaction(msg.id, "down")}
                                                className={`p-1 rounded hover:bg-muted ${reactions[msg.id] === "down" ? "text-red-400" : "text-muted-foreground"}`}
                                                title="Not helpful"
                                            >
                                                <ThumbsDown className="h-3 w-3" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                                    <span className="text-sm text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="border-t border-border p-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 rounded-xl bg-muted/50 border border-border px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-0 hover:opacity-90 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
            <ScheduleUploader isOpen={isUploaderOpen} onClose={() => setIsUploaderOpen(false)} />
        </>
    );
};

