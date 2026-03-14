"use client";

import React, { useState } from "react";
import { StickyNote, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickNotesProps {
    isVisible: boolean;
    onSave: (note: string) => void;
    existingNotes?: string;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({
    isVisible,
    onSave,
    existingNotes = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [note, setNote] = useState(existingNotes);
    const [notesList, setNotesList] = useState<string[]>(
        existingNotes ? existingNotes.split("\n---\n").filter(Boolean) : []
    );

    const handleSave = () => {
        if (!note.trim()) return;

        const newNotesList = [...notesList, note];
        setNotesList(newNotesList);
        onSave(newNotesList.join("\n---\n"));
        setNote("");
        setIsOpen(false);
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center group hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300"
                title="Quick Capture (Ctrl+N)"
            >
                <StickyNote className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                {notesList.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-[10px] font-black flex items-center justify-center">
                        {notesList.length}
                    </span>
                )}
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg mx-4"
                        >
                            <div className="rounded-3xl bg-card border border-border p-6 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <StickyNote className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground">
                                                💭 Quick Capture
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                Capture thoughts without breaking flow
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </div>

                                {/* Previous Notes */}
                                {notesList.length > 0 && (
                                    <div className="mb-4 max-h-32 overflow-y-auto space-y-2">
                                        {notesList.map((n, i) => (
                                            <div
                                                key={i}
                                                className="p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground font-medium border border-border/50"
                                            >
                                                {n}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Input */}
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            handleSave();
                                        }
                                    }}
                                    placeholder="What's on your mind? (Ctrl+Enter to save)"
                                    className="w-full h-32 p-4 rounded-xl bg-muted/30 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all"
                                    autoFocus
                                />

                                {/* Actions */}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={!note.trim()}
                                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Save Note
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-6 h-12 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>

                                <p className="text-[10px] text-muted-foreground/50 text-center mt-3">
                                    Notes are saved with your focus session
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
