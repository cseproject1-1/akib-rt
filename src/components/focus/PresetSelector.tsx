"use client";

import React from "react";
import { Timer, Zap, Flame, Settings } from "lucide-react";
import { motion } from "framer-motion";

export type FocusPresetId = "classic" | "deepWork" | "sprint" | "custom";

export interface FocusPresetConfig {
    id: FocusPresetId;
    name: string;
    icon: React.ReactNode;
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    description: string;
    color: string;
}

interface PresetSelectorProps {
    currentPreset: FocusPresetId;
    onSelectPreset: (preset: FocusPresetId, config: FocusPresetConfig) => void;
    disabled?: boolean;
}

const PRESET_CONFIGS: FocusPresetConfig[] = [
    {
        id: "classic",
        name: "Classic",
        icon: <Timer className="h-4 w-4" />,
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        description: "Traditional 25/5/15 Pomodoro",
        color: "from-purple-500 to-pink-500",
    },
    {
        id: "deepWork",
        name: "Deep Work",
        icon: <Flame className="h-4 w-4" />,
        focusMinutes: 50,
        shortBreakMinutes: 10,
        longBreakMinutes: 30,
        description: "Extended focus for complex tasks",
        color: "from-orange-500 to-red-500",
    },
    {
        id: "sprint",
        name: "Sprint",
        icon: <Zap className="h-4 w-4" />,
        focusMinutes: 15,
        shortBreakMinutes: 3,
        longBreakMinutes: 10,
        description: "Quick bursts for rapid progress",
        color: "from-yellow-500 to-orange-500",
    },
    {
        id: "custom",
        name: "Custom",
        icon: <Settings className="h-4 w-4" />,
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        description: "Your personalized rhythm",
        color: "from-cyan-500 to-blue-500",
    },
];

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    currentPreset,
    onSelectPreset,
    disabled = false,
}) => {
    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Focus Mode
            </label>

            <div className="grid grid-cols-2 gap-3">
                {PRESET_CONFIGS.map((preset) => {
                    const isSelected = currentPreset === preset.id;

                    return (
                        <motion.button
                            key={preset.id}
                            onClick={() => onSelectPreset(preset.id, preset)}
                            disabled={disabled}
                            whileHover={!disabled ? { scale: 1.02 } : {}}
                            whileTap={!disabled ? { scale: 0.98 } : {}}
                            className={`
                relative p-4 rounded-2xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected
                                    ? `border-transparent bg-gradient-to-br ${preset.color} text-white shadow-lg`
                                    : "border-border bg-card hover:bg-muted/50 text-foreground"
                                }
              `}
                        >
                            {/* Selection Indicator */}
                            {isSelected && (
                                <motion.div
                                    layoutId="preset-selector"
                                    className="absolute inset-0 rounded-2xl ring-2 ring-offset-2 ring-offset-background ring-white/50"
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                />
                            )}

                            <div className="relative flex items-start gap-3">
                                <div
                                    className={`
                  h-9 w-9 rounded-xl flex items-center justify-center shrink-0
                  ${isSelected
                                            ? "bg-white/20"
                                            : `bg-gradient-to-br ${preset.color}/10`
                                        }
                `}
                                >
                                    <div
                                        className={isSelected ? "text-white" : "text-purple-500"}
                                    >
                                        {preset.icon}
                                    </div>
                                </div>

                                <div className="flex-1 text-left">
                                    <p className="font-bold text-sm mb-0.5">{preset.name}</p>
                                    <p
                                        className={`text-[10px] leading-snug ${isSelected ? "text-white/80" : "text-muted-foreground"
                                            }`}
                                    >
                                        {preset.description}
                                    </p>

                                    {/* Duration Display */}
                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono">
                                        <span
                                            className={`px-2 py-0.5 rounded ${isSelected ? "bg-white/20" : "bg-muted"
                                                }`}
                                        >
                                            {preset.focusMinutes}m
                                        </span>
                                        <span className="opacity-50">/</span>
                                        <span
                                            className={`px-2 py-0.5 rounded ${isSelected ? "bg-white/20" : "bg-muted"
                                                }`}
                                        >
                                            {preset.shortBreakMinutes}m
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Info */}
            <p className="text-[10px] text-muted-foreground text-center">
                {currentPreset === "classic" && "🍅 Traditional Pomodoro technique"}
                {currentPreset === "deepWork" && "🔥 Maximize concentration periods"}
                {currentPreset === "sprint" && "⚡ Perfect for quick tasks"}
                {currentPreset === "custom" && "⚙️ Customize in settings"}
            </p>
        </div>
    );
};

export { PRESET_CONFIGS };
