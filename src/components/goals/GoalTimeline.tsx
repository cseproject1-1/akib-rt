"use client";

import { useMemo } from "react";
import { Goal } from "./GoalCard";
import { format, differenceInDays, isPast, addDays } from "date-fns";
import { Target, Flag, CheckCircle, CalendarDays, Milestone as MilestoneIcon } from "lucide-react";

interface GoalTimelineProps {
    goals: Goal[];
    onGoalClick?: (goal: Goal) => void;
}

export const GoalTimeline = ({ goals, onGoalClick }: GoalTimelineProps) => {
    // Sort goals by target date
    const sortedGoals = useMemo(() => {
        return [...goals].sort((a, b) =>
            new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
        );
    }, [goals]);

    // Find date range
    const { minDate, maxDate } = useMemo(() => {
        if (sortedGoals.length === 0) {
            return { minDate: new Date(), maxDate: addDays(new Date(), 90) };
        }

        const dates = sortedGoals.map((g) => new Date(g.targetDate));
        const now = new Date();

        return {
            minDate: now,
            maxDate: new Date(Math.max(...dates.map((d) => d.getTime()), addDays(now, 30).getTime()))
        };
    }, [sortedGoals]);

    const totalDays = Math.max(differenceInDays(maxDate, minDate), 1);

    const getGoalStatus = (goal: Goal) => {
        if (goal.isCompleted) return "completed";
        if (isPast(new Date(goal.targetDate))) return "overdue";
        if (differenceInDays(new Date(goal.targetDate), new Date()) <= 7) return "soon";
        return "active";
    };

    const statusColors = {
        completed: "bg-green-500",
        overdue: "bg-red-500",
        soon: "bg-yellow-500",
        active: "bg-primary",
    };
 
    const statusBg = {
        completed: "bg-green-500/10 border-green-500",
        overdue: "bg-red-500/10 border-red-500",
        soon: "bg-yellow-500/10 border-yellow-500",
        active: "bg-black border-foreground",
    };

    if (goals.length === 0) {
        return (
            <div className="brutal-card p-12 text-center bg-background border-foreground">
                <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-foreground mb-3">No Goals Yet</h3>
                <p className="text-base font-bold text-muted-foreground uppercase italic tracking-tight">
                    Create goals to see your timeline visualization
                </p>
            </div>
        );
    }

    return (
        <div className="brutal-card p-10 bg-black border-4 border-foreground brutal-shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-6 mb-12">
                <div className="h-16 w-16 brutal-border border-4 bg-primary flex items-center justify-center brutal-shadow-sm transition-transform hover:scale-110 hover:rotate-3">
                    <CalendarDays className="h-8 w-8 text-primary-foreground stroke-[3]" />
                </div>
                <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic text-foreground leading-none">Goal Timeline</h3>
                    <p className="text-xs font-black uppercase tracking-[0.3em] italic text-primary mt-2">
                        {format(minDate, "MMM d")} → {format(maxDate, "MMM d, yyyy")}
                    </p>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Timeline Track */}
                <div className="absolute left-6 top-0 bottom-0 w-1.5 bg-foreground/10" />

                {/* Today Marker */}
                <div className="absolute left-2.5 top-0 z-10 flex items-center">
                    <div className="h-8 w-8 brutal-border border-4 bg-primary flex items-center justify-center shadow-none brutal-glow">
                        <div className="h-3 w-3 bg-foreground" />
                    </div>
                    <span className="ml-6 text-sm font-black uppercase tracking-[0.4em] italic text-primary">Today</span>
                </div>

                {/* Goal Items */}
                <div className="space-y-4 pt-10">
                    {sortedGoals.map((goal) => {
                        const status = getGoalStatus(goal);
                        const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
                        
                        // Calculate progress from milestones
                        const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
                        const completedMilestones = milestones.filter(m => m.isCompleted).length;
                        const totalMilestones = milestones.length;
                        const progress = totalMilestones > 0
                            ? Math.round((completedMilestones / totalMilestones) * 100)
                            : goal.isCompleted ? 100 : 0;

                        return (
                            <div
                                key={goal.id}
                                className="relative pl-16 cursor-pointer group"
                                onClick={() => onGoalClick?.(goal)}
                            >
                                {/* Timeline Node */}
                                <div className={`absolute left-3 top-6 h-8 w-8 brutal-border border-4 flex items-center justify-center transition-all group-hover:scale-125 group-hover:brutal-glow ${status === "completed"
                                        ? "bg-green-500 border-green-500"
                                        : status === "overdue"
                                            ? "bg-red-500 border-red-500"
                                            : "bg-primary border-foreground"
                                    }`}>
                                    {status === "completed" ? (
                                        <CheckCircle className="h-4 w-4 text-white stroke-[4]" />
                                    ) : (
                                        <Flag className="h-4 w-4 text-white stroke-[3]" />
                                    )}
                                </div>

                                {/* Goal Card */}
                                <div className={`p-6 brutal-border border-4 ${statusBg[status as keyof typeof statusBg]} transition-all group-hover:-translate-y-2 brutal-shadow-sm group-hover:brutal-shadow-lg shadow-none group-hover:shadow-none bg-black`}>
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            {/* Goal Title */}
                                            <div className="flex items-center gap-4 mb-3">
                                                <span className="text-3xl transition-transform group-hover:scale-110">{goal.icon || "🎯"}</span>
                                                <h4 className={`text-xl font-black uppercase tracking-tighter truncate italic ${status === "completed" ? "text-green-500/50 line-through" : "text-foreground"
                                                    }`}>
                                                    {goal.title}
                                                </h4>
                                            </div>

                                            {/* Description */}
                                            {goal.description && (
                                                <p className="text-xs font-bold text-muted-foreground line-clamp-1 mb-4 italic uppercase tracking-tight">
                                                    {goal.description}
                                                </p>
                                            )}

                                            {/* Progress Bar */}
                                            {(progress > 0 || goal.isCompleted) && (
                                                <div className="flex items-center gap-4">
                                                    <MilestoneIcon className="h-5 w-5 text-primary stroke-[3]" />
                                                    <div className="flex-1 h-4 brutal-border border-2 bg-black overflow-hidden shadow-none">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ease-out ${status === "completed" ? "bg-green-500" : "bg-primary"}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-black italic text-primary">
                                                        {progress}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Date & Status */}
                                        <div className="text-right shrink-0">
                                            <p className="text-base font-black uppercase italic text-foreground leading-none mb-2">
                                                {format(new Date(goal.targetDate), "MMM d")}
                                            </p>
                                            <p className={`text-[11px] font-black uppercase tracking-[0.2em] italic leading-none ${status === "completed" ? "text-green-500" :
                                                    status === "overdue" ? "text-red-500" :
                                                        status === "soon" ? "text-yellow-500" :
                                                            "text-muted-foreground"
                                                }`}>
                                                {status === "completed" ? "Complete" :
                                                    status === "overdue" ? `${Math.abs(daysLeft)}d overdue` :
                                                        daysLeft === 0 ? "Due today" :
                                                            `${daysLeft}d left`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-12 mt-12 pt-8 border-t-4 border-foreground/10">
                {[
                    { status: "active", label: "Active" },
                    { status: "soon", label: "Due Soon" },
                    { status: "overdue", label: "Overdue" },
                    { status: "completed", label: "Completed" },
                ].map(({ status, label }) => (
                    <div key={status} className="flex items-center gap-4 group/l cursor-help">
                        <div className={`h-5 w-5 brutal-border border-2 transition-transform group-hover/l:scale-125 ${statusColors[status as keyof typeof statusColors]}`} />
                        <span className="text-xs font-black uppercase tracking-[0.2em] italic text-muted-foreground group-hover/l:text-foreground transition-colors">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
