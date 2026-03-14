"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from "lucide-react";
import { Button } from "./Button";

type ConfirmType = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmType;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning"
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    // Handle animations
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsVisible(true), 10);
            // Focus confirm button when dialog opens
            setTimeout(() => confirmButtonRef.current?.focus(), 100);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    // Handle keyboard events
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleCancel();
            } else if (e.key === "Enter" && e.ctrlKey) {
                handleConfirm();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // Handle visibility change (tab switching)
    useEffect(() => {
        if (!isOpen) return;

        const handleVisibilityChange = () => {
            if (!document.hidden && isOpen) {
                // Re-focus when returning to tab
                setTimeout(() => confirmButtonRef.current?.focus(), 100);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    // Type-based styling
    const typeConfig = {
        danger: {
            icon: AlertCircle,
            iconColor: "text-red-400",
            iconBg: "bg-red-500/10",
            borderColor: "border-red-500/30",
            buttonClass: "bg-red-500 hover:bg-red-600 text-white"
        },
        warning: {
            icon: AlertTriangle,
            iconColor: "text-yellow-400",
            iconBg: "bg-yellow-500/10",
            borderColor: "border-yellow-500/30",
            buttonClass: "bg-yellow-500 hover:bg-yellow-600 text-white"
        },
        info: {
            icon: Info,
            iconColor: "text-blue-400",
            iconBg: "bg-blue-500/10",
            borderColor: "border-blue-500/30",
            buttonClass: "bg-blue-500 hover:bg-blue-600 text-white"
        },
        success: {
            icon: CheckCircle,
            iconColor: "text-emerald-400",
            iconBg: "bg-emerald-500/10",
            borderColor: "border-emerald-500/30",
            buttonClass: "bg-emerald-500 hover:bg-emerald-600 text-white"
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div
            ref={dialogRef}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"
                }`}
            onClick={handleCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className={`relative w-full max-w-md transform transition-all duration-200 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 pb-4">
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`h-12 w-12 rounded-2xl ${config.iconBg} border ${config.borderColor} flex items-center justify-center shrink-0`}>
                                <Icon className={`h-6 w-6 ${config.iconColor}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1">
                                <h3 id="dialog-title" className="text-lg font-bold text-foreground mb-1">
                                    {title}
                                </h3>
                                {description && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {description}
                                    </p>
                                )}
                            </div>

                            {/* Close button */}
                            <button
                                onClick={handleCancel}
                                className="p-1 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                                aria-label="Close dialog"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-white/5 flex items-center justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            className="min-w-[100px]"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            ref={confirmButtonRef}
                            onClick={handleConfirm}
                            className={`min-w-[100px] border-0 ${config.buttonClass}`}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Hook for programmatic usage
export function useConfirm() {
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        description?: string;
        confirmText?: string;
        cancelText?: string;
        type?: ConfirmType;
        onConfirm?: () => void;
        onCancel?: () => void;
    }>({
        isOpen: false,
        title: "",
    });

    const confirm = (options: {
        title: string;
        description?: string;
        confirmText?: string;
        cancelText?: string;
        type?: ConfirmType;
    }): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                ...options,
                isOpen: true,
                onConfirm: () => {
                    resolve(true);
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                },
                onCancel: () => {
                    resolve(false);
                    setDialogState(prev => ({ ...prev, isOpen: false }));
                },
            });
        });
    };

    const closeDialog = () => {
        // Call onCancel callback if it exists
        if (dialogState.onCancel) {
            dialogState.onCancel();
        }
    };

    const ConfirmDialogComponent = (
        <ConfirmDialog
            isOpen={dialogState.isOpen}
            onClose={closeDialog}
            onConfirm={dialogState.onConfirm || (() => { })}
            title={dialogState.title}
            description={dialogState.description}
            confirmText={dialogState.confirmText}
            cancelText={dialogState.cancelText}
            type={dialogState.type}
        />
    );

    return { confirm, ConfirmDialogComponent };
}
