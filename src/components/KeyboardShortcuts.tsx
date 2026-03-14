"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/context/UIContext";
import { Keyboard, X } from "lucide-react";

interface Shortcut {
    keys: string[];
    description: string;
    action: () => void;
}

export const KeyboardShortcuts: React.FC = () => {
    const router = useRouter();
    const { setSidebarOpen, setSettingsOpen, setTaskModalOpen } = useUI();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const shortcuts: Shortcut[] = [
        {
            keys: ["Ctrl", "N"],
            description: "New Task",
            action: () => setTaskModalOpen?.(true),
        },
        {
            keys: ["Ctrl", "F"],
            description: "Focus Mode",
            action: () => router.push("/focus"),
        },
        {
            keys: ["Ctrl", "G"],
            description: "Goals",
            action: () => router.push("/goals"),
        },
        {
            keys: ["Ctrl", "A"],
            description: "Analytics",
            action: () => router.push("/analytics"),
        },
        {
            keys: ["Ctrl", "\\"],
            description: "Toggle Sidebar",
            action: () => setSidebarOpen?.((prev: boolean) => !prev),
        },
        {
            keys: ["Ctrl", ","],
            description: "Settings",
            action: () => setSettingsOpen?.(true),
        },
        {
            keys: ["Ctrl", "/"],
            description: "Keyboard Shortcuts",
            action: () => setIsHelpOpen(true),
        },
        {
            keys: ["Esc"],
            description: "Close Modal/Sidebar",
            action: () => {
                setSidebarOpen?.(false);
                setIsHelpOpen(false);
            },
        },
    ];

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        if (
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLSelectElement
        ) {
            return;
        }

        const key = e.key.toLowerCase();
        const isCtrl = e.ctrlKey || e.metaKey;

        // Find matching shortcut
        const shortcut = shortcuts.find(s => {
            const shortcutKey = s.keys[s.keys.length - 1].toLowerCase();
            const needsCtrl = s.keys.includes("Ctrl");

            if (needsCtrl && isCtrl && key === shortcutKey) return true;
            if (!needsCtrl && !isCtrl && key === shortcutKey) return true;
            return false;
        });

        if (shortcut) {
            e.preventDefault();
            shortcut.action();
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!isHelpOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsHelpOpen(false)}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 p-6 rounded-3xl bg-card border border-border shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Keyboard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Keyboard Shortcuts</h3>
                            <p className="text-xs text-muted-foreground">Navigate faster</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsHelpOpen(false)}
                        className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="space-y-2">
                    {shortcuts.map((shortcut, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <span className="text-sm text-foreground">{shortcut.description}</span>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, j) => (
                                    <React.Fragment key={j}>
                                        <kbd className="px-2 py-1 text-xs font-mono font-bold bg-muted rounded-lg border border-border text-foreground">
                                            {key}
                                        </kbd>
                                        {j < shortcut.keys.length - 1 && (
                                            <span className="text-xs text-muted-foreground">+</span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                        Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">Esc</kbd> to close
                    </p>
                </div>
            </div>
        </div>
    );
};
