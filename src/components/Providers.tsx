"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { TaskProvider } from "@/context/TaskContext";
import { UIProvider } from "@/context/UIContext";
import { GoalProvider } from "@/context/GoalContext";
import { AIProvider } from "@/context/AIContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PWAProvider } from "@/context/PWAContext";

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <UIProvider>
          <GoalProvider>
            <TaskProvider>
              <AIProvider>
                <NotificationProvider>
                  <PWAProvider>
                    {children}
                  </PWAProvider>
                </NotificationProvider>
              </AIProvider>
            </TaskProvider>
          </GoalProvider>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
