"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Loader2, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTask } from "@/context/TaskContext";
import { useAI } from "@/context/AIContext";

interface ParsedTask {
    title: string;
    startTime: string;
    endTime: string;
    days: string[];
    icon: string;
    timeBlock: string;
}

interface ScheduleUploaderProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ScheduleUploader: React.FC<ScheduleUploaderProps> = ({ isOpen, onClose }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addTask } = useTask();
    const { aiPlatform } = useAI();

    const handleFile = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);

        setIsLoading(true);
        setError(null);
        setParsedTasks([]);

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("platform", aiPlatform);

            const response = await fetch("/api/ai/parse-schedule", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to parse schedule");
            }

            setParsedTasks(data.tasks);
        } catch (err: any) {
            setError(err.message || "Failed to parse schedule. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const addAllTasks = async () => {
        setIsLoading(true);
        try {
            for (const task of parsedTasks) {
                await addTask({
                    title: task.title,
                    icon: task.icon,
                    startTime: task.startTime,
                    endTime: task.endTime,
                    timeBlock: task.timeBlock as any,
                    days: task.days,
                });
            }
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setParsedTasks([]);
                setPreview(null);
            }, 1500);
        } catch (err) {
            setError("Failed to add tasks. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const removeTask = (index: number) => {
        setParsedTasks((prev) => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-background/95 p-6 shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Import Schedule</h2>
                        <p className="text-sm text-muted-foreground">Upload a photo of your class routine</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Upload Area */}
                {!preview && (
                    <div
                        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all ${isDragging
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 hover:border-white/20"
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileInput}
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                                <ImageIcon className="h-8 w-8 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium mb-1">Drop your schedule image here</p>
                                <p className="text-sm text-muted-foreground">or click to browse</p>
                            </div>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Choose Image
                            </Button>
                        </div>
                    </div>
                )}

                {/* Preview & Results */}
                {preview && (
                    <div className="space-y-4">
                        {/* Image Preview */}
                        <div className="relative rounded-xl overflow-hidden">
                            <img src={preview} alt="Schedule" className="w-full h-48 object-cover" />
                            {isLoading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                                        <p className="text-sm text-white">Analyzing schedule...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                All classes added to your routine!
                            </div>
                        )}

                        {/* Parsed Tasks */}
                        {parsedTasks.length > 0 && !success && (
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Found {parsedTasks.length} classes:
                                </p>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {parsedTasks.map((task, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <span className="text-xl">{task.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{task.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {task.startTime} - {task.endTime} • {task.days.join(", ")}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeTask(index)}
                                                className="text-muted-foreground hover:text-red-400 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={addAllTasks}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Add All to Routine
                                </Button>
                            </div>
                        )}

                        {/* Try Again Button */}
                        {(error || parsedTasks.length === 0) && !isLoading && (
                            <Button
                                onClick={() => { setPreview(null); setError(null); }}
                                variant="outline"
                                className="w-full"
                            >
                                Try Different Image
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
