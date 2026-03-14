import React from "react";
import { Button } from "@/components/ui/Button";
import { Play, Pause, RotateCcw, Coffee, Zap, Moon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SessionControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onToggle: () => void;
  onReset: () => void;
  sessionType: "focus" | "shortBreak" | "longBreak";
  onSetSession: (type: "focus" | "shortBreak" | "longBreak") => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  isActive,
  isPaused,
  onToggle,
  onReset,
  sessionType,
  onSetSession
}) => {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex w-full rounded-2xl bg-muted p-1.5 border border-border">
        <SessionButton
          active={sessionType === "focus"}
          onClick={() => onSetSession("focus")}
          icon={Zap}
          label="Focus"
        />
        <SessionButton
          active={sessionType === "shortBreak"}
          onClick={() => onSetSession("shortBreak")}
          icon={Coffee}
          label="Short"
        />
        <SessionButton
          active={sessionType === "longBreak"}
          onClick={() => onSetSession("longBreak")}
          icon={Moon}
          label="Long"
        />
      </div>

      <div className="flex items-center gap-8">
        <Button
          onClick={onToggle}
          className={cn(
            "h-24 w-24 rounded-[2rem] transition-all transform hover:scale-105 active:scale-95 shadow-xl",
            isActive && !isPaused
              ? "bg-secondary text-secondary-foreground border-2 border-border hover:bg-secondary/80"
              : "bg-primary text-primary-foreground border-0 shadow-primary/25 hover:bg-primary/90"
          )}
        >
          {isActive && !isPaused ? (
            <Pause className="h-10 w-10" />
          ) : (
            <Play className="h-10 w-10 ml-1 fill-current" />
          )}
        </Button>

        <button
          onClick={onReset}
          className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all hover:rotate-[-45deg]"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

function SessionButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all uppercase tracking-widest",
        active
          ? "bg-background text-foreground shadow-sm border border-border"
          : "text-muted-foreground/60 hover:text-foreground hover:bg-background/50"
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-primary" : "opacity-60")} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export { SessionControls };
