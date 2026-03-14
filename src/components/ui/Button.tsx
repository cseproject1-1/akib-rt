import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
  size?: "sm" | "md" | "lg" | "icon" | "xl";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground brutal-btn",
      secondary: "bg-foreground text-background brutal-btn",
      outline: "bg-transparent text-foreground brutal-border brutal-btn shadow-none hover:bg-muted",
      ghost: "bg-transparent text-foreground hover:bg-muted font-bold",
      danger: "bg-destructive text-white brutal-btn",
      gradient: "bg-primary text-primary-foreground brutal-btn", // Fallback for neo-brutalism
    };

    const sizes = {
      sm: "h-9 px-4 text-xs font-bold uppercase tracking-wider",
      md: "h-12 px-6 py-2 text-sm font-bold uppercase tracking-tight",
      lg: "h-14 px-8 text-base font-bold uppercase tracking-tight",
      xl: "h-16 px-10 text-lg font-bold uppercase tracking-tight",
      icon: "h-12 w-12 p-0 flex items-center justify-center brutal-border brutal-shadow bg-card hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50 select-none",
          variants[variant as keyof typeof variants],
          sizes[size as keyof typeof sizes],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, cn };
