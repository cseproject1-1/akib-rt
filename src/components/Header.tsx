"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Moon, Sun, Settings, LayoutTemplate, Menu, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/Button";
import { TemplatesModal } from "./TemplatesModal";
import { SettingsModal } from "./SettingsModal";
import { NotificationCenter } from "./NotificationCenter";

import { useUI } from "@/context/UIContext";

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { toggleSidebar } = useUI();
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-24 items-center justify-between glass-border bg-background/90 backdrop-blur-lg px-6 md:px-12 rounded-b-3xl">
        <Link href="/" className="flex items-center gap-4 hover:translate-x-1 transition-transform">
          <div className="h-12 w-12 glass-border bg-primary/90 flex items-center justify-center text-primary-foreground font-black text-xl glass-shadow rounded-full backdrop-blur-sm">
            RT
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground hidden sm:block">Routine Tracker</h1>
        </Link>
 
        <div className="flex items-center gap-4">
          <NotificationCenter />
 
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="hidden md:flex glass-border glass-shadow bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground rounded-full"
          >
            <Sun className="h-6 w-6 scale-0 transition-all dark:scale-100" />
            <Moon className="absolute h-6 w-6 scale-100 transition-all dark:scale-0" />
          </Button>
 
          <Link
            href="/marketplace"
            className="hidden md:flex items-center gap-2 glass-border glass-shadow px-4 py-2 font-black uppercase tracking-tighter hover:bg-primary hover:text-primary-foreground transition-colors rounded-full backdrop-blur-sm bg-background/80"
          >
            <LayoutTemplate className="h-5 w-5" />
            <span className="text-sm">Templates</span>
          </Link>
 
          <Button
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
            size="icon"
            className="hidden md:flex clay-border px-6 h-12 hover:bg-primary hover:text-primary-foreground rounded-full"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden md:inline text-sm font-black uppercase tracking-tighter ml-2">Settings</span>
          </Button>
 
          <Button
            onClick={toggleSidebar}
            className="h-14 w-14 glass-border bg-primary/90 text-primary-foreground p-0 flex items-center justify-center glass-shadow hover:translate-x-0.5 hover:translate-y-0.5 rounded-full backdrop-blur-sm"
          >
            <Menu className="w-8 h-8" />
          </Button>
        </div>
      </header>
 
      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export { Header };
