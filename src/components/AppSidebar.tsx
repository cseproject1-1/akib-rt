"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  Calendar as CalendarIcon,
  Timer,
  Target,
  Trophy,
  ShoppingBag,
  X,
  Sparkles,
  LogOut,
  Award,
  LayoutTemplate
} from "lucide-react";
import { Button } from "./ui/Button";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { usePWA } from "@/context/PWAContext";
import { Download } from "lucide-react";

// Helper Component for Install Button
const PWAInstallButton = () => {
  const { isInstallable, installApp } = usePWA();
  if (!isInstallable) return null;

  return (
    <div className="mb-4">
      <Button
        onClick={installApp}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground brutal-btn"
      >
        <Download className="mr-2 h-4 w-4" />
        Install App
      </Button>
    </div>
  );
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ITEMS = [
  { name: "Routine", href: "/", icon: LayoutDashboard },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Focus", href: "/focus", icon: Timer },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Achievements", href: "/achievements", icon: Award },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Templates", href: "/marketplace", icon: LayoutTemplate },
];

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarOpen: isOpen, setSidebarOpen: setIsOpen } = useUI();
  const { user: currentUser, logout } = useAuth();

  // Debug log to ensure user is defined
  console.log("AppSidebar User:", currentUser);


  return (
    <>
      {/* Sidebar Container - Hidden by default, shown when isOpen is true */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-72 transform brutal-border bg-background transition-all duration-500 ease-in-out brutal-shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-24 items-center justify-between px-8 border-b brutal-border border-b-muted">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden brutal-border brutal-shadow">
              <img src="/logo.jpg" alt="Routine Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-foreground">RT</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-foreground hover:bg-primary hover:text-primary-foreground brutal-border"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="space-y-4 px-4 py-8">
          {ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center gap-4 px-5 py-4 text-sm font-bold uppercase tracking-widest transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground brutal-border brutal-shadow shadow-primary/20"
                    : "text-foreground hover:bg-muted brutal-border border-transparent hover:border-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-125",
                  isActive ? "text-primary-foreground" : "text-foreground"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-6">
          {/* Install App Button (Visible only if installable) */}
          <PWAInstallButton />

          {currentUser ? (
            <div className="group relative brutal-border bg-card p-4 transition-all hover:bg-muted brutal-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden brutal-border">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-xs font-black text-primary-foreground">
                      {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <h4 className="truncate text-sm font-black uppercase text-foreground">
                    {currentUser.displayName || "Pro Member"}
                  </h4>
                  <p className="truncate text-[10px] font-bold text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>

                <div className="flex h-8 w-8 cursor-pointer items-center justify-center brutal-border bg-card text-foreground transition-all hover:bg-destructive hover:text-white" onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 brutal-border bg-primary px-3 py-1.5 shadow-none">
                <Sparkles className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                  Premium Plan
                </span>
              </div>
            </div>
          ) : (
            <div className="brutal-border bg-card p-4 text-center brutal-shadow">
              <p className="text-sm font-bold uppercase text-muted-foreground">Please log in</p>
            </div>
          )}
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {
        isOpen && (
          <div
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />
        )
      }
    </>
  );
};

export { AppSidebar };
