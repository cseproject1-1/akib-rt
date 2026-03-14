"use client";

import React from "react";
import { Timer, X, Play, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResumeSessionDialogProps {
    isOpen: boolean;
    onResume: () => void;
    onDiscard: () => void;
    sessionData: {
        duration: number;
        sessionType: string;
        taskTitle?: string;
        remainingMinutes: number;
        remainingSeconds: number;
    } | null;
}

export const ResumeSessionDialog: React.FC<ResumeSessionDialogProps> = ({
    isOpen,
    onResume,
    onDiscard,
    sessionData,
}) => {
    if (!isOpen || !sessionData) return null;

    const formatTime = (mins: number, secs: number) => {
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4"
                    >
                        <div className="rounded-3xl bg-card border border-border p-8 shadow-2xl relative overflow-hidden">
                            {/* Animated Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse -z-10" />

                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 animate-pulse">
                                    <Timer className="h-10 w-10" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-center space-y-4">
                                <h2 className="text-2xl font-black text-foreground">
                                    Session in Progress
                                </h2>

                                <p className="text-muted-foreground font-medium">
                                    You have an incomplete {sessionData.sessionType} session
                                    {sessionData.taskTitle && (
                                        <>
                                            {" "}
                                            for <span className="font-bold text-foreground">{sessionData.taskTitle}</span>
                                        </>
                                    )}
                                </p>

                                {/* Remaining Time */}
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-xs text-muted-foreground uppercase font-bold mb-2">
                                        Time Remaining
                                    </p>
                                    <p className="text-5xl font-black text-foreground font-mono tracking-tight">
                                        {formatTime(sessionData.remainingMinutes, sessionData.remainingSeconds)}
                                    </p>
                                </div>

                                <p className="text-sm text-muted-foreground/80">
                                    Would you like to resume where you left off?
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 space-y-3">
                                <button
                                    onClick={onResume}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="h-4 w-4" />
                                    Resume Session
                                </button>

                                <button
                                    onClick={onDiscard}
                                    className="w-full h-12 rounded-xl bg-muted text-foreground font-medium hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 border border-transparent transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Start Fresh
                                </button>
                            </div>

                            <p className="text-[10px] text-muted-foreground/50 text-center mt-6">
                                Resuming will continue your distraction tracking
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
