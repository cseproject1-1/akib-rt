"use client";

import React, { useState } from "react";
import { useTask } from "@/context/TaskContext";
import { useGoal } from "@/context/GoalContext";
import { ExportService } from "@/lib/ExportService";
import { Download, FileText, FileSpreadsheet, FileJson, Calendar, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const { tasks } = useTask();
    const { goals } = useGoal();
    const [periodDays, setPeriodDays] = useState(30);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);

    const handleExport = async (type: "csv" | "text" | "json") => {
        setIsExporting(type);

        try {
            // Small delay for UX feedback
            await new Promise(resolve => setTimeout(resolve, 500));

            switch (type) {
                case "csv":
                    ExportService.downloadCSV(tasks, goals, periodDays);
                    break;
                case "text":
                    ExportService.downloadText(tasks, goals, periodDays);
                    break;
                case "json":
                    ExportService.downloadJSON(tasks, goals);
                    break;
            }

            setExportSuccess(type);
            setTimeout(() => setExportSuccess(null), 2000);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setIsExporting(null);
        }
    };

    if (!isOpen) return null;

    const exportOptions = [
        {
            id: "csv",
            label: "CSV Spreadsheet",
            description: "Open in Excel, Google Sheets, or Numbers",
            icon: FileSpreadsheet,
            color: "from-emerald-500 to-green-500"
        },
        {
            id: "text",
            label: "Text Report",
            description: "Formatted report for printing or reading",
            icon: FileText,
            color: "from-blue-500 to-cyan-500"
        },
        {
            id: "json",
            label: "JSON Backup",
            description: "Full data backup for restoration",
            icon: FileJson,
            color: "from-purple-500 to-pink-500"
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Download className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Export Data</h3>
                            <p className="text-xs text-muted-foreground">Download your progress and routines</p>
                        </div>
                    </div>
                </div>

                {/* Period Selection */}
                <div className="p-4 border-b border-border bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Export period:</span>
                        <select
                            value={periodDays}
                            onChange={(e) => setPeriodDays(Number(e.target.value))}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={90}>Last 90 days</option>
                            <option value={365}>Last year</option>
                        </select>
                    </div>
                </div>

                {/* Export Options */}
                <div className="p-6 space-y-3">
                    {exportOptions.map((option) => {
                        const Icon = option.icon;
                        const isLoading = isExporting === option.id;
                        const isSuccess = exportSuccess === option.id;

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleExport(option.id as any)}
                                disabled={isExporting !== null}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isSuccess
                                        ? "bg-emerald-500/20 border-emerald-500/30"
                                        : "bg-white/[0.02] border-white/10 hover:bg-white/5 hover:border-purple-500/30"
                                    } ${isExporting !== null && !isLoading ? "opacity-50" : ""}`}
                            >
                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shrink-0`}>
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                                    ) : isSuccess ? (
                                        <CheckCircle className="h-5 w-5 text-white" />
                                    ) : (
                                        <Icon className="h-5 w-5 text-white" />
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-bold text-foreground">{option.label}</h4>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                </div>
                                {!isLoading && !isSuccess && (
                                    <Download className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Stats Preview */}
                <div className="p-4 border-t border-border bg-white/[0.02]">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-lg font-bold text-foreground">{tasks.length}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tasks</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">{goals.length}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Goals</p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">{periodDays}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
