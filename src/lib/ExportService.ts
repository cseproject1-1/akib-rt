"use client";

import { Task } from "@/context/TaskContext";
import { Goal } from "@/context/GoalContext";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export interface ExportData {
    exportDate: string;
    period: string;
    stats: {
        totalTasks: number;
        completedTasks: number;
        completionRate: number;
        currentStreak: number;
        longestStreak: number;
    };
    tasks: {
        title: string;
        timeBlock: string;
        days: string[];
        completionCount: number;
        streak: number;
    }[];
    goals: {
        title: string;
        targetDate: string;
        isCompleted: boolean;
        milestonesCompleted: number;
        totalMilestones: number;
    }[];
    dailyLog: {
        date: string;
        completed: number;
        total: number;
        rate: number;
    }[];
}

export class ExportService {

    /**
     * Generate export data from tasks and goals
     */
    static generateExportData(
        tasks: Task[],
        goals: Goal[],
        periodDays: number = 30
    ): ExportData {
        const today = new Date();
        const startDate = subDays(today, periodDays - 1);

        // Calculate stats
        const totalCompleted = tasks.reduce((sum, t) => sum + t.completionHistory.length, 0);

        // Calculate daily log
        const dailyLog = eachDayOfInterval({ start: startDate, end: today }).map(date => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayName = format(date, "EEE").toUpperCase();

            const scheduledToday = tasks.filter(t => t.days.includes(dayName));
            const completedToday = scheduledToday.filter(t => t.completionHistory.includes(dateStr));

            return {
                date: format(date, "MMM d, yyyy"),
                completed: completedToday.length,
                total: scheduledToday.length,
                rate: scheduledToday.length > 0
                    ? Math.round((completedToday.length / scheduledToday.length) * 100)
                    : 0
            };
        });

        // Calculate completion rate for period
        const totalScheduled = dailyLog.reduce((sum, d) => sum + d.total, 0);
        const totalDone = dailyLog.reduce((sum, d) => sum + d.completed, 0);
        const completionRate = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : 0;

        // Calculate streaks
        let currentStreak = 0;
        for (let i = 0; i < 365; i++) {
            const dateStr = format(subDays(today, i), "yyyy-MM-dd");
            const anyDone = tasks.some(t => t.completionHistory.includes(dateStr));
            if (anyDone) currentStreak++;
            else if (i > 0) break;
        }

        // Task summaries
        const taskSummaries = tasks.map(t => ({
            title: t.title,
            timeBlock: t.timeBlock,
            days: t.days,
            completionCount: t.completionHistory.length,
            streak: 0 // Would need calculateStreak function
        }));

        // Goal summaries - using progress field from Goal type
        const goalSummaries = goals.map(g => ({
            title: g.title,
            targetDate: format(new Date(g.targetDate), "MMM d, yyyy"),
            isCompleted: g.isCompleted,
            milestonesCompleted: g.progress,
            totalMilestones: 100
        }));

        return {
            exportDate: format(today, "MMMM d, yyyy 'at' h:mm a"),
            period: `${format(startDate, "MMM d")} - ${format(today, "MMM d, yyyy")}`,
            stats: {
                totalTasks: tasks.length,
                completedTasks: totalDone,
                completionRate,
                currentStreak,
                longestStreak: currentStreak // Simplified
            },
            tasks: taskSummaries,
            goals: goalSummaries,
            dailyLog
        };
    }

    /**
     * Export data as CSV
     */
    static exportAsCSV(data: ExportData): string {
        const lines: string[] = [];

        // Header
        lines.push("Routine Tracker Export Report");
        lines.push(`Generated: ${data.exportDate}`);
        lines.push(`Period: ${data.period}`);
        lines.push("");

        // Stats
        lines.push("SUMMARY STATISTICS");
        lines.push(`Total Tasks,${data.stats.totalTasks}`);
        lines.push(`Tasks Completed,${data.stats.completedTasks}`);
        lines.push(`Completion Rate,${data.stats.completionRate}%`);
        lines.push(`Current Streak,${data.stats.currentStreak} days`);
        lines.push("");

        // Tasks
        lines.push("TASKS");
        lines.push("Title,Time Block,Days,Completions");
        data.tasks.forEach(t => {
            lines.push(`"${t.title}",${t.timeBlock},"${t.days.join(", ")}",${t.completionCount}`);
        });
        lines.push("");

        // Goals
        lines.push("GOALS");
        lines.push("Title,Target Date,Status,Milestones");
        data.goals.forEach(g => {
            lines.push(`"${g.title}",${g.targetDate},${g.isCompleted ? "Completed" : "In Progress"},${g.milestonesCompleted}/${g.totalMilestones}`);
        });
        lines.push("");

        // Daily Log
        lines.push("DAILY LOG");
        lines.push("Date,Completed,Scheduled,Rate");
        data.dailyLog.forEach(d => {
            lines.push(`${d.date},${d.completed},${d.total},${d.rate}%`);
        });

        return lines.join("\n");
    }

    /**
     * Export data as formatted text (for PDF)
     */
    static exportAsText(data: ExportData): string {
        const lines: string[] = [];

        lines.push("═══════════════════════════════════════════════════════════");
        lines.push("                    ROUTINE TRACKER REPORT                    ");
        lines.push("═══════════════════════════════════════════════════════════");
        lines.push("");
        lines.push(`Generated: ${data.exportDate}`);
        lines.push(`Period: ${data.period}`);
        lines.push("");
        lines.push("───────────────────────────────────────────────────────────");
        lines.push("                     SUMMARY STATISTICS                        ");
        lines.push("───────────────────────────────────────────────────────────");
        lines.push("");
        lines.push(`  📋 Total Tasks Created:      ${data.stats.totalTasks}`);
        lines.push(`  ✅ Tasks Completed:          ${data.stats.completedTasks}`);
        lines.push(`  📊 Completion Rate:          ${data.stats.completionRate}%`);
        lines.push(`  🔥 Current Streak:           ${data.stats.currentStreak} days`);
        lines.push(`  🏆 Longest Streak:           ${data.stats.longestStreak} days`);
        lines.push("");
        lines.push("───────────────────────────────────────────────────────────");
        lines.push("                         TASKS                                 ");
        lines.push("───────────────────────────────────────────────────────────");
        lines.push("");

        data.tasks.forEach((t, i) => {
            lines.push(`  ${i + 1}. ${t.title}`);
            lines.push(`     ⏰ ${t.timeBlock} | 📅 ${t.days.join(", ")} | ✓ ${t.completionCount} times`);
            lines.push("");
        });

        lines.push("───────────────────────────────────────────────────────────");
        lines.push("                         GOALS                                 ");
        lines.push("───────────────────────────────────────────────────────────");
        lines.push("");

        data.goals.forEach((g, i) => {
            const status = g.isCompleted ? "✅ COMPLETED" : "🎯 In Progress";
            lines.push(`  ${i + 1}. ${g.title}`);
            lines.push(`     📆 Due: ${g.targetDate} | ${status}`);
            if (g.totalMilestones > 0) {
                lines.push(`     📍 Milestones: ${g.milestonesCompleted}/${g.totalMilestones}`);
            }
            lines.push("");
        });

        lines.push("═══════════════════════════════════════════════════════════");
        lines.push("              Generated by Routine Tracker                     ");
        lines.push("═══════════════════════════════════════════════════════════");

        return lines.join("\n");
    }

    /**
     * Download a file
     */
    static downloadFile(content: string, filename: string, mimeType: string) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export as CSV file
     */
    static downloadCSV(tasks: Task[], goals: Goal[], periodDays: number = 30) {
        const data = this.generateExportData(tasks, goals, periodDays);
        const csv = this.exportAsCSV(data);
        const filename = `routine-tracker-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
        this.downloadFile(csv, filename, "text/csv");
    }

    /**
     * Export as text file (for printing)
     */
    static downloadText(tasks: Task[], goals: Goal[], periodDays: number = 30) {
        const data = this.generateExportData(tasks, goals, periodDays);
        const text = this.exportAsText(data);
        const filename = `routine-tracker-report-${format(new Date(), "yyyy-MM-dd")}.txt`;
        this.downloadFile(text, filename, "text/plain");
    }

    /**
     * Export as JSON backup
     */
    static downloadJSON(tasks: Task[], goals: Goal[]) {
        const data = {
            exportDate: new Date().toISOString(),
            version: "1.0",
            tasks,
            goals
        };
        const json = JSON.stringify(data, null, 2);
        const filename = `routine-tracker-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
        this.downloadFile(json, filename, "application/json");
    }
}
