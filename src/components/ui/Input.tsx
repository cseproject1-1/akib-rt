import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className="text-sm font-medium text-muted-foreground pl-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "flex h-12 w-full brutal-border bg-card px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus:translate-x-0.5 focus:translate-y-0.5 focus:shadow-none disabled:cursor-not-allowed disabled:opacity-50 brutal-shadow",
              leftIcon && "pl-10",
              error && "border-destructive focus:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 pl-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
