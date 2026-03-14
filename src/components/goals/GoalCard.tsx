"use client";

import { useMemo } from "react";
import { Button, cn } from "@/components/ui/Button";
import { Target, Calendar, Trash2, Edit2, CheckCircle } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

export interface Goal {
    id: string;
    title: string;
    description: string;
    icon: string;
    targetDate: string; // ISO date string
    createdAt: string;
    milestones: Milestone[];
    linkedTaskIds: string[];
    isCompleted: boolean;
}

export interface Milestone {
    id: string;
    title: string;
    isCompleted: boolean;
}

interface GoalCardProps {
    goal: Goal;
    onEdit: (goal: Goal) => void;
    onDelete: (id: string) => void;
    onToggleComplete: (id: string) => void;
    onToggleMilestone: (goalId: string, milestoneId: string) => void;
}

export const GoalCard = ({
    goal,
    onEdit,
    onDelete,
    onToggleComplete,
    onToggleMilestone,
}: GoalCardProps) => {
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = differenceInDays(targetDate, new Date());
    const isOverdue = isPast(targetDate) && !goal.isCompleted;

    // Safety check for milestones
    const rawMilestones = goal.milestones;
    const milestones = Array.isArray(rawMilestones) ? rawMilestones : [];

    const completedMilestones = milestones.filter(m => m.isCompleted).length;
    const totalMilestones = milestones.length;
    const progress = totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : goal.isCompleted ? 100 : 0;

    return (
        <div
            className={cn(
                "group relative overflow-hidden brutal-card p-1 pb-1 transition-all duration-300",
                goal.isCompleted
                    ? "bg-green-500/10 border-green-500 brutal-shadow-sm"
                    : isOverdue
                        ? "bg-red-500/10 border-red-500 brutal-shadow-sm"
                        : "bg-black border-foreground brutal-shadow-lg hover:-translate-y-2 hover:brutal-glow active:translate-y-0 active:shadow-none"
            )}
        >
            <div className="p-6 brutal-border border-0 border-b-4 border-foreground bg-muted/30">
                {/* Background Glow */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-5">
                        <div className="flex h-20 w-20 items-center justify-center brutal-border border-4 bg-primary text-5xl shadow-none transition-transform group-hover:scale-110 group-hover:rotate-3">
                            {goal.icon}
                        </div>
                        <div>
                            <h3 className={cn(
                                "text-3xl font-black uppercase tracking-tighter leading-none italic mb-2",
                                goal.isCompleted ? "text-green-500" : "text-foreground"
                            )}>
                                {goal.title}
                            </h3>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary stroke-[3]" />
                                    <span className={cn(
                                        "text-xs font-black uppercase tracking-[0.2em] italic",
                                        isOverdue ? "text-red-500" : "text-muted-foreground"
                                    )}>
                                        {isOverdue
                                            ? `Overdue (${Math.abs(daysRemaining)}d)`
                                            : daysRemaining === 0
                                                ? "Due today"
                                                : `${daysRemaining} days left`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onToggleComplete(goal.id)}
                                className={cn(
                                    "h-11 w-11 brutal-border border-4 transition-all brutal-shadow active:translate-x-1 active:translate-y-1 active:shadow-none shadow-none",
                                    goal.isCompleted
                                        ? "bg-green-500 text-white"
                                        : "bg-background text-muted-foreground"
                                )}
                            >
                                <CheckCircle className="h-6 w-6 stroke-[3]" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onEdit(goal)}
                                className="h-11 w-11 brutal-border border-4 bg-background text-foreground transition-all brutal-shadow active:translate-x-1 active:translate-y-1 active:shadow-none shadow-none"
                            >
                                <Edit2 className="h-5 w-5 stroke-[3]" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onDelete(goal.id)}
                                className="h-11 w-11 brutal-border border-4 bg-red-500 text-white transition-all brutal-shadow active:translate-x-1 active:translate-y-1 active:shadow-none shadow-none"
                            >
                                <Trash2 className="h-5 w-5 stroke-[3]" />
                            </Button>
                        </div>
                    </div>

                    {/* Description */}
                    {goal.description && (
                        <p className="text-base font-bold text-muted-foreground/80 mb-6 line-clamp-2 italic uppercase tracking-tight leading-relaxed">
                            {goal.description}
                        </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black uppercase tracking-[0.3em] italic text-muted-foreground">Overall progress</span>
                            <span className="text-base font-black italic text-primary">{progress}%</span>
                        </div>
                        <div className="h-6 w-full brutal-border border-4 bg-black overflow-hidden shadow-none">
                            <div
                                className={cn(
                                    "h-full transition-all duration-1000 ease-out brutal-border border-0 border-r-4 border-foreground",
                                    goal.isCompleted
                                        ? "bg-green-500"
                                        : "bg-primary"
                                )}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Milestones */}
                    {milestones.length > 0 && (
                        <div className="space-y-3">
                            <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                                Milestones ({completedMilestones}/{totalMilestones})
                            </span>
                            <div className="space-y-2">
                                {milestones.slice(0, 3).map((milestone) => (
                                    <button
                                        key={milestone.id}
                                        onClick={() => onToggleMilestone(goal.id, milestone.id)}
                                        className={cn(
                                            "flex items-center gap-4 w-full p-4 brutal-border border-2 text-left transition-all hover:-translate-x-1 hover:bg-foreground/5",
                                            milestone.isCompleted
                                                ? "bg-green-500/10 border-green-500/50 text-green-500"
                                                : "bg-black border-foreground/20 text-muted-foreground"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-6 w-6 brutal-border border-2 flex items-center justify-center transition-all",
                                            milestone.isCompleted
                                                ? "border-green-500 bg-green-500"
                                                : "border-muted-foreground/30 bg-black"
                                        )}>
                                            {milestone.isCompleted && (
                                                <CheckCircle className="h-4 w-4 text-white stroke-[4]" />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-sm font-black uppercase tracking-tight italic",
                                            milestone.isCompleted && "line-through opacity-60"
                                        )}>
                                            {milestone.title}
                                        </span>
                                    </button>
                                ))}
                                {milestones.length > 3 && (
                                    <p className="text-xs font-black uppercase italic text-muted-foreground/40 pl-2">
                                        +{milestones.length - 3} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Target Date */}
                    <div className="mt-6 pt-6 border-t-4 border-foreground/10">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] italic">
                            <span className="text-muted-foreground">Target Date</span>
                            <span className="text-foreground">
                                {format(targetDate, "MMM d, yyyy")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
