"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
    isInstallable: boolean;
    isInstalled: boolean;
    installApp: () => Promise<void>;
    dismissPrompt: () => void;
    showPrompt: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
        }

        // Listen for the install prompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user previously dismissed the prompt
            let hasDismissed = false;
            try {
                hasDismissed = localStorage.getItem("rt_pwa_dismissed") === "true";
            } catch (err) {
                console.warn("LocalStorage access denied:", err);
            }

            // Only show if NOT dismissed
            if (!hasDismissed) {
                // Delay prompt slightly
                setTimeout(() => setShowPrompt(true), 2000);
            }
        };

        // Detect successful installation
        const handleAppInstalled = () => {
            setShowPrompt(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const dismissPrompt = () => {
        setShowPrompt(false);
        // Permanently dismiss for this browser
        try {
            localStorage.setItem("rt_pwa_dismissed", "true");
        } catch (err) {
            console.warn("LocalStorage write failed:", err);
        }
    };

    const isInstallable = !!deferredPrompt && !isInstalled;

    return (
        <PWAContext.Provider value={{ isInstallable, isInstalled, installApp, dismissPrompt, showPrompt }}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error("usePWA must be used within a PWAProvider");
    }
    return context;
};
