"use client";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { X, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

// App version - increment this when there are major updates
const APP_VERSION = "1.0.0";

const OnboardingTour: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { user } = useAuth();

    useEffect(() => {
        const checkIfShouldShowTour = async () => {
            if (!user) return;

            try {
                // Check if user has seen this version of the tour
                const tourData = localStorage.getItem("rt_tour_data");
                let shouldShow = true;

                if (tourData) {
                    const { version, hasSeen } = JSON.parse(tourData);

                    // If user has seen the current version, don't show
                    if (hasSeen && version === APP_VERSION) {
                        shouldShow = false;
                    }
                }

                // For existing users (old accounts), check if they have any tasks
                // If they have tasks, they're an existing user - skip tour unless version changed
                if (shouldShow) {
                    const tasksRef = collection(db, "tasks");
                    const userTasksQuery = query(
                        tasksRef,
                        where("userId", "==", user.uid),
                        limit(1)
                    );

                    const snapshot = await getDocs(userTasksQuery);

                    // If user has existing tasks, they're not a new user
                    if (!snapshot.empty) {
                        const tourData = localStorage.getItem("rt_tour_data");
                        if (tourData) {
                            const { version } = JSON.parse(tourData);
                            // Only show if version changed (indicating an update)
                            if (version === APP_VERSION) {
                                shouldShow = false;
                            }
                        } else {
                            // Old user without tour data - mark as seen without showing
                            localStorage.setItem("rt_tour_data", JSON.stringify({
                                version: APP_VERSION,
                                hasSeen: true
                            }));
                            shouldShow = false;
                        }
                    }
                }

                if (shouldShow) {
                    // Small delay to allow UI to load
                    const timer = setTimeout(() => setIsOpen(true), 1500);
                    return () => clearTimeout(timer);
                }
            } catch (e) {
                console.error("Error checking tour status:", e);
            }
        };

        checkIfShouldShowTour();
    }, [user]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsOpen(false);
        try {
            localStorage.setItem("rt_tour_data", JSON.stringify({
                version: APP_VERSION,
                hasSeen: true,
                completedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.error("Error saving tour completion:", e);
        }
    };

    const handleSkip = () => {
        setIsOpen(false);
        try {
            localStorage.setItem("rt_tour_data", JSON.stringify({
                version: APP_VERSION,
                hasSeen: true,
                skippedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.error("Error saving tour skip:", e);
        }
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
                    className="relative w-full max-w-md overflow-hidden brutal-card bg-card p-8 border-4 border-foreground brutal-shadow-lg"
                >
                    {/* Progress Indicators */}
                    <div className="flex gap-3 mb-8 justify-center">
                        {STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-4 w-4 brutal-border border-2 transition-all duration-200 ${idx === currentStep ? "bg-primary brutal-shadow scale-110" : "bg-muted"
                                    }`}
                            />
                        ))}
                    </div>
 
                    <div className="text-center space-y-6 mb-10">
                        <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter italic leading-none">
                            {step.title}
                        </h3>
                        <p className="text-foreground font-bold leading-tight uppercase tracking-tight text-sm">
                            {step.description}
                        </p>
                    </div>
 
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={handleSkip}
                            className="flex-1 h-14 brutal-border border-4 bg-background text-muted-foreground hover:bg-muted font-black uppercase italic shadow-none transition-all active:translate-x-1 active:translate-y-1"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="flex-[2] h-14 brutal-border border-4 bg-primary text-primary-foreground font-black uppercase italic shadow-none transition-all hover:-translate-y-1 brutal-shadow active:translate-y-0 active:translate-x-0"
                        >
                            {currentStep === STEPS.length - 1 ? (
                                <span className="flex items-center gap-2">
                                    Get Started <Check className="w-5 h-5 stroke-[3]" />
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Next <ChevronRight className="w-5 h-5 stroke-[3]" />
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
