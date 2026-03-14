import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isActive: boolean;
  totalSeconds: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ minutes, seconds, isActive, totalSeconds }) => {
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "relative flex h-80 w-80 items-center justify-center rounded-full transition-all duration-1000 border border-border",
          isActive
            ? "bg-gradient-to-br from-purple-500/5 to-pink-500/5 shadow-[0_0_80px_rgba(168,85,247,0.1)] scale-105"
            : "bg-muted/30"
        )}
      >
        {/* Animated Progress Ring */}
        <svg className="absolute inset-0 h-full w-full -rotate-90">
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/20"
          />
          {isActive && (
            <circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="url(#timer-gradient)"
              strokeWidth="8"
              strokeDasharray="942"
              strokeDashoffset={942 - (942 * ((minutes * 60 + seconds) / (totalSeconds || 1)))}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          )}
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        <div className="flex flex-col items-center">
          <span className={cn(
            "text-8xl font-black tracking-tighter text-foreground drop-shadow-sm",
            isActive && "animate-pulse"
          )}>
            {formattedMinutes}:{formattedSeconds}
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-60 mt-2">
            Flow Time
          </span>
        </div>
      </div>
    </div>
  );
};

export { TimerDisplay };
