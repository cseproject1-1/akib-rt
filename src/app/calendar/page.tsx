"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { MonthView } from "@/components/calendar/MonthView";
import { TaskModal } from "@/components/TaskModal";
import { useTask } from "@/context/TaskContext";
import { format, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from "lucide-react";

export default function CalendarPage() {
    const { tasks } = useTask();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const selectedDayName = format(selectedDate, "EEE").toUpperCase();
    const selectedDayString = format(selectedDate, "yyyy-MM-dd");

    // Filter tasks:
    // 1. If specificDate is set: match exact date only
    // 2. If specificDate is NOT set: match recurring day name
    const selectedDayTasks = tasks.filter(t => {
        if (t.specificDate) {
            return t.specificDate === selectedDayString;
        }
        return t.days.includes(selectedDayName);
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header />
            <main className="container mx-auto max-w-5xl px-6 pt-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-4xl font-bold tracking-tight text-foreground">{format(currentDate, "MMMM yyyy")}</h2>
                        <p className="text-muted-foreground font-medium">Your longitudinal perspective on routine discipline.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevMonth}
                            className="h-12 w-12 rounded-2xl bg-muted hover:bg-muted/80 text-foreground"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextMonth}
                            className="h-12 w-12 rounded-2xl bg-muted hover:bg-muted/80 text-foreground"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                </div>

                <div className="p-8 rounded-[3rem] bg-card border border-border shadow-xl">
                    <MonthView
                        currentDate={currentDate}
                        tasks={tasks}
                        onSelectDate={setSelectedDate}
                        selectedDate={selectedDate}
                    />
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Agenda for {format(selectedDate, "MMMM d")}</h3>
                        </div>
                        <Button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-4 gap-2 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
                        >
                            <Plus className="h-4 w-4" />
                            Add Task
                        </Button>
                    </div>

                    {selectedDayTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedDayTasks.map(task => (
                                <div key={task.id} className="group relative flex items-center gap-4 rounded-[2rem] p-5 bg-card border border-border transition-all hover:shadow-lg hover:border-primary/20">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl shadow-sm">
                                        {task.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-foreground truncate">{task.title}</div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                            <Clock className="w-3 h-3 text-primary" />
                                            {task.startTime} - {task.endTime}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] group-hover:text-primary/60 transition-colors">
                                        {task.timeBlock}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center rounded-[2.5rem] bg-muted/30 border border-dashed border-border">
                            <p className="text-muted-foreground font-medium italic">No routines scheduled for this alignment.</p>
                        </div>
                    )}
                </div>
            </main>

            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                defaultDay={selectedDayName}
                specificDate={selectedDayString}
            />
        </div>
    );
}

