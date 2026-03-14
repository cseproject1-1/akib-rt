"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, cn } from "@/components/ui/Button";
import { Download, Clock, Calendar, CheckCircle } from "lucide-react";
import { MarketplaceTemplate } from "@/data/marketplaceTemplates";
import { useTask, Task } from "@/context/TaskContext";
import { v4 as uuidv4 } from "uuid";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface TemplatePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: MarketplaceTemplate | null;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
    isOpen,
    onClose,
    template,
}) => {
    const { replaceAllTasks, tasks } = useTask();
    const { confirm, ConfirmDialogComponent } = useConfirm();

    if (!template) return null;

    const handleApply = async () => {
        const message = tasks.length > 0
            ? `Apply "${template.name}" template?`
            : `Apply "${template.name}" template?`;

        const description = tasks.length > 0
            ? `This will replace your ${tasks.length} existing task${tasks.length > 1 ? 's' : ''} with ${template.tasks.length} tasks from this template.`
            : `This will add ${template.tasks.length} tasks from this template to your schedule.`;

        const confirmed = await confirm({
            title: message,
            description,
            confirmText: "Apply Template",
            cancelText: "Cancel",
            type: "warning"
        });

        if (confirmed) {
            const newTasks: Task[] = template.tasks.map((t) => ({
                ...t,
                id: uuidv4(),
                isCompleted: false,
                completionHistory: [],
            }));
            await replaceAllTasks(newTasks);
            onClose();
        }
    };

    const getTimeBlockColor = (timeBlock: string) => {
        switch (timeBlock) {
            case "Dawn": return "bg-indigo-500/20 text-indigo-400";
            case "Morning": return "bg-orange-500/20 text-orange-400";
            case "Noon": return "bg-yellow-500/20 text-yellow-400";
            case "Afternoon": return "bg-green-500/20 text-green-400";
            case "Evening": return "bg-purple-500/20 text-purple-400";
            case "Night": return "bg-blue-500/20 text-blue-400";
            default: return "bg-white/10 text-white";
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={template.name}
            className="max-w-2xl"
        >
            <div className="space-y-6 py-2">
                {/* Header Info */}
                <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-4xl shadow-inner shrink-0">
                        {template.icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-muted-foreground">{template.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                {template.category}
                            </span>
                            <span className="text-xs text-muted-foreground">by {template.author}</span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Download className="h-3 w-3" />
                                {template.downloads.toLocaleString()} downloads
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tasks Preview */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-purple-400">
                        <Calendar className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            Included Tasks ({template.tasks.length})
                        </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {template.tasks.map((task, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl shrink-0">
                                    {task.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white truncate">
                                        {task.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            {task.startTime} - {task.endTime}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                            getTimeBlockColor(task.timeBlock)
                                        )}>
                                            {task.timeBlock}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    {task.days.slice(0, 3).map((day) => (
                                        <span
                                            key={day}
                                            className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold text-muted-foreground"
                                        >
                                            {day.slice(0, 2)}
                                        </span>
                                    ))}
                                    {task.days.length > 3 && (
                                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-bold text-muted-foreground">
                                            +{task.days.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Apply Button */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                    <div className="flex-1" />
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold px-8 border-0"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        className="h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-12 border-0 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform gap-2"
                    >
                        <CheckCircle className="h-5 w-5" />
                        Apply Template
                    </Button>
                </div>
            </div>
            {ConfirmDialogComponent}
        </Modal>
    );
};
