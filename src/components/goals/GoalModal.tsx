"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, cn } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Target, Plus, X, Calendar } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Goal, Milestone } from "./GoalCard";

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, "id" | "createdAt" | "isCompleted"> | Goal) => void;
    goalToEdit?: Goal;
}

export const GoalModal = ({
    isOpen,
    onClose,
    onSave,
    goalToEdit,
}: GoalModalProps) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("🎯");
    const [targetDate, setTargetDate] = useState("");
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [newMilestone, setNewMilestone] = useState("");

    useEffect(() => {
        if (goalToEdit) {
            setTitle(goalToEdit.title || "");
            setDescription(goalToEdit.description || "");
            setIcon(goalToEdit.icon || "🎯");
            setTargetDate(goalToEdit.targetDate ? goalToEdit.targetDate.split("T")[0] : "");
            setMilestones(goalToEdit.milestones || []);
        } else {
            resetForm();
        }
    }, [goalToEdit, isOpen]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setIcon("🎯");
        setTargetDate("");
        setMilestones([]);
        setNewMilestone("");
    };

    const handleAddMilestone = () => {
        if (newMilestone.trim()) {
            setMilestones([
                ...milestones,
                { id: uuidv4(), title: newMilestone.trim(), isCompleted: false },
            ]);
            setNewMilestone("");
        }
    };

    const handleRemoveMilestone = (id: string) => {
        setMilestones(milestones.filter((m) => m.id !== id));
    };

    const handleSave = () => {
        if (!title.trim() || !targetDate) return;

        const goalData = {
            title: title.trim(),
            description: description.trim(),
            icon,
            targetDate: new Date(targetDate).toISOString(),
            milestones,
            linkedTaskIds: goalToEdit?.linkedTaskIds || [],
        };

        if (goalToEdit) {
            onSave({ ...goalToEdit, ...goalData });
        } else {
            onSave(goalData as Omit<Goal, "id" | "createdAt" | "isCompleted">);
        }

        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={goalToEdit ? "Edit Goal" : "Create New Goal"}
            className="max-w-2xl"
        >
            <div className="space-y-6 py-2">
                {/* Title & Icon */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-32 shrink-0">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 block italic">
                            Icon
                        </label>
                        <input
                            type="text"
                            value={icon}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIcon(e.target.value)}
                            maxLength={2}
                            className="flex h-16 w-full brutal-border border-4 bg-primary text-center text-4xl focus:outline-none focus:bg-primary focus:scale-105 transition-all brutal-shadow-lg brutal-glow"
                        />
                    </div>
                    <div className="flex-1">
                        <Input
                            label="Goal Title"
                            labelClassName="text-xs font-black text-primary uppercase tracking-[0.3em] mb-3 block italic"
                            placeholder="What is your mission?"
                            value={title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                            className="h-16 bg-black text-2xl font-black uppercase tracking-tighter italic brutal-border border-4 focus:bg-primary/5"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                    <label className="text-xs font-black text-primary uppercase tracking-[0.3em] block italic">
                        The Blueprint (Description)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        placeholder="Detail your path to greatness..."
                        rows={3}
                        className="w-full brutal-border border-4 bg-black p-4 text-lg font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:bg-primary/5 transition-all resize-none italic uppercase tracking-tight leading-relaxed"
                    />
                </div>

                {/* Target Date */}
                <div className="p-8 brutal-card bg-black border-foreground/50 border-4">
                    <div className="flex items-center gap-4 mb-4 text-primary">
                        <Calendar className="h-6 w-6 stroke-[4] drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                        <span className="text-sm font-black uppercase tracking-[0.3em] italic">
                            Deadline
                        </span>
                    </div>
                    <Input
                        type="date"
                        value={targetDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetDate(e.target.value)}
                        className="h-16 bg-black brutal-border border-4 text-xl font-black uppercase italic focus:bg-primary/5"
                    />
                </div>

                {/* Milestones */}
                <div className="p-8 brutal-card bg-black border-foreground/50 border-4">
                    <div className="flex items-center gap-4 mb-4 text-primary">
                        <Target className="h-6 w-6 stroke-[4] drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                        <span className="text-sm font-black uppercase tracking-[0.3em] italic">
                            Strategic Milestones
                        </span>
                    </div>

                    {/* Add Milestone */}
                    <div className="flex gap-4 mb-8 text-white">
                        <Input
                            placeholder="Add a milestone towards victory..."
                            value={newMilestone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAddMilestone()}
                            className="h-16 bg-black brutal-border border-4 text-xl font-black uppercase italic focus:bg-primary/5"
                        />
                        <Button
                            onClick={handleAddMilestone}
                            disabled={!newMilestone.trim()}
                            className="h-16 px-8 brutal-border border-4 bg-foreground text-background brutal-shadow-lg hover:-translate-y-1 hover:brutal-glow transition-all active:translate-y-0 active:shadow-none shrink-0"
                        >
                            <Plus className="h-8 w-8 stroke-[4]" />
                        </Button>
                    </div>

                    {/* Milestone List */}
                    {milestones.length > 0 ? (
                        <div className="space-y-4 max-h-72 overflow-y-auto pr-4 custom-scrollbar">
                            {milestones.map((milestone, index) => (
                                <div
                                    key={milestone.id}
                                    className="flex items-center justify-between gap-6 p-5 brutal-border border-4 bg-black brutal-shadow-sm hover:brutal-shadow transition-shadow group"
                                >
                                    <div className="flex items-center gap-5">
                                        <span className="text-sm font-black text-primary w-8 italic">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <span className="text-xl font-black uppercase tracking-tight text-foreground italic">
                                            {milestone.title}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleRemoveMilestone(milestone.id)}
                                        className="h-12 w-12 brutal-border border-4 bg-red-500 text-white hover:bg-red-600 brutal-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shadow-none opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-6 w-6 stroke-[4]" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xl font-black text-muted-foreground/20 text-center py-10 italic uppercase tracking-[0.4em]">
                            No milestones set
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t-8 border-foreground bg-black">
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-20 px-12 text-2xl font-black uppercase italic brutal-btn bg-black text-foreground border-4 border-foreground hover:bg-foreground hover:text-background transition-colors"
                    >
                        Abort
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!title.trim() || !targetDate}
                        className="h-20 px-16 text-2xl font-black uppercase italic brutal-btn bg-primary text-primary-foreground brutal-shadow-lg hover:-translate-y-2 hover:brutal-glow transition-all active:translate-y-0 active:shadow-none shadow-none hover:shadow-none"
                    >
                        {goalToEdit ? "Update Goal" : "Initialize Goal"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
