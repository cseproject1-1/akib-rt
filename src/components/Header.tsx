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
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl md:px-12">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src="/logo.jpg"
            alt="RT Logo"
            className="h-10 w-10 rounded-xl shadow-lg shadow-purple-500/20"
          />
          <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">Routine Tracker</h1>
        </Link>

        <div className="flex items-center gap-3">
          <NotificationCenter />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <Sun className="h-5 w-5 scale-0 transition-all dark:scale-100" />
            <Moon className="absolute h-5 w-5 scale-100 transition-all dark:scale-0" />
          </Button>

          <Link
            href="/marketplace"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <LayoutTemplate className="h-5 w-5" />
            <span className="hidden md:inline text-sm font-medium">Templates</span>
          </Link>

          <Button
            variant="ghost"
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all gap-2 px-3"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden md:inline text-sm font-medium">Settings</span>
          </Button>

          <Button
            onClick={toggleSidebar}
            className="h-14 w-14 rounded-2xl shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 transition-transform active:scale-90 p-0 flex items-center justify-center"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export { Header };
