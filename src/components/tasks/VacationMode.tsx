"use client";

import React, { useState } from "react";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { Palmtree, Calendar, Play, Pause, AlertTriangle, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { format, addDays, isBefore, isAfter, parseISO } from "date-fns";
import { toast } from "sonner";

interface VacationModeProps {
    onClose?: () => void;
}

export const VacationMode: React.FC<VacationModeProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
    const [isActive, setIsActive] = useState(false);
    const [preserveStreak, setPreserveStreak] = useState(true);

    const handleActivate = async () => {
        // In a full implementation, this would:
        // 1. Store vacation dates in user profile
        // 2. Pause all recurring tasks
        // 3. Optionally preserve streak by excluding vacation days

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation

            setIsActive(true);

            // Show confirmation
            toast.success("🏝️ Vacation Mode activated!", {
                description: `From ${format(parseISO(startDate), "MMM d, yyyy")} to ${format(parseISO(endDate), "MMM d, yyyy")}. All recurring tasks will be paused.`,
                duration: 5000,
            });

            onClose?.();
        } catch (error) {
            toast.error("Failed to activate vacation mode", {
                description: "Please try again later",
            });
        }
    };

    const handleDeactivate = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate async operation

            setIsActive(false);

            toast.success("✅ Vacation Mode deactivated", {
                description: "All tasks have been resumed!",
            });
        } catch (error) {
            toast.error("Failed to deactivate vacation mode");
        }
    };

    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="rounded-3xl bg-card border border-border p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Palmtree className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Vacation Mode</h3>
                    <p className="text-sm text-muted-foreground">Pause tasks while you're away</p>
                </div>
            </div>

            {isActive ? (
                /* Active State */
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                        <Palmtree className="h-8 w-8 text-cyan-400 mx-auto mb-2 animate-bounce" />
                        <h4 className="font-bold text-cyan-400 mb-1">🏝️ You're on Vacation!</h4>
                        <p className="text-sm text-muted-foreground">
                            Tasks are paused. Enjoy your break!
                        </p>
                    </div>

                    <Button
                        onClick={handleDeactivate}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Resume All Tasks
                    </Button>
                </div>
            ) : (
                /* Setup State */
                <div className="space-y-4">
                    {/* Date Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                                Start Date
                            </label>
                            <div className="relative">
                                <Sun className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                                End Date
                            </label>
                            <div className="relative">
                                <Moon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Duration Display */}
                    <div className="p-3 rounded-xl bg-white/5 text-center">
                        <span className="text-2xl font-bold text-foreground">{daysDiff}</span>
                        <span className="text-sm text-muted-foreground ml-1">days</span>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={preserveStreak}
                                onChange={(e) => setPreserveStreak(e.target.checked)}
                                className="h-5 w-5 rounded accent-purple-500"
                            />
                            <div>
                                <span className="text-sm font-medium text-foreground">Preserve my streak</span>
                                <p className="text-xs text-muted-foreground">Vacation days won't count against your streak</p>
                            </div>
                        </label>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                            All recurring tasks will be paused during this period. One-time tasks will remain due on their original dates.
                        </p>
                    </div>

                    {/* Activate Button */}
                    <Button
                        onClick={handleActivate}
                        disabled={daysDiff < 1}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0"
                    >
                        <Pause className="h-4 w-4 mr-2" />
                        Activate Vacation Mode
                    </Button>
                </div>
            )}
        </div>
    );
};
