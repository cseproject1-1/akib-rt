"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { X, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TourStep {
    title: string;
    description: string;
    targetId?: string; // ID of the element to highlight (optional)
    position?: "center" | "top" | "bottom";
}

const STEPS: TourStep[] = [
    {
        title: "Welcome to RT!",
        description: "Let's take a quick tour to help you build your perfect routine.",
        position: "center",
    },
    {
        title: "Your Daily Flow",
        description: "These 6 time blocks are your canvas. Fill them with habits to structure your day.",
        position: "center", // Ideally this would point to the grid, but center is safe
    },
    {
        title: "Add a Task",
        description: "Click here to add your first habit or routine. You can set days, times, and icons.",
        targetId: "add-task-trigger", // We need to add this ID to the ProgressBar button
        position: "bottom",
    },
    {
        title: "Stay Focused",
        description: "Use the Focus page to enter deep work mode with ambient sounds and a timer.",
        position: "center",
    },
];

const OnboardingTour: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has seen the tour
        const hasSeen = localStorage.getItem("rt_has_seen_tour");
        if (!hasSeen) {
            // Small delay to allow UI to load
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsOpen(false);
        localStorage.setItem("rt_has_seen_tour", "true");
    };

    const handleSkip = () => {
        setIsOpen(false);
        localStorage.setItem("rt_has_seen_tour", "true");
    };

    if (!isOpen) return null;

    const step = STEPS[currentStep];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleSkip}
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-card p-8 shadow-2xl border border-border"
                >
                    {/* Progress Indicators */}
                    <div className="flex gap-2 mb-6 justify-center">
                        {STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? "w-8 bg-purple-500" : "w-1.5 bg-muted-foreground/20"
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="text-center space-y-4 mb-8">
                        <h3 className="text-2xl font-bold text-foreground tracking-tight">
                            {step.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-muted font-medium"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg shadow-purple-500/20"
                        >
                            {currentStep === STEPS.length - 1 ? (
                                <span className="flex items-center gap-2">
                                    Get Started <Check className="w-4 h-4" />
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Next <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export { OnboardingTour };
