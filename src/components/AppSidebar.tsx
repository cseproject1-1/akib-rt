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
  LogOut
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
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white border-0"
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
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
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
          "fixed inset-y-0 left-0 z-[70] w-72 transform border-r border-border bg-background/95 backdrop-blur-2xl transition-all duration-500 ease-in-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-24 items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-purple-500/20">
              <img src="/logo.jpg" alt="Routine Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">RT</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center gap-4 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-r from-purple-500/10 to-transparent text-purple-400 border-l-2 border-purple-500"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive ? "text-purple-400" : "text-muted-foreground/60 group-hover:text-foreground"
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
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-muted/50 p-4 transition-all hover:bg-muted hover:border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-purple-500/30 shadow-inner">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || "User"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold text-white">
                      {currentUser.displayName?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <h4 className="truncate text-sm font-bold text-foreground">
                    {currentUser.displayName || "Pro Member"}
                  </h4>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>

                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400" onClick={() => logout()}>
                  <LogOut className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-3 py-1.5 border border-purple-500/20">
                <Sparkles className="h-3 w-3 text-purple-500 fill-purple-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-200">
                  Premium Plan
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Please log in</p>
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
