// ============================================================================
// UI CONTEXT (GLOBAL UI STATE)
// ============================================================================
// this context manages the global state of the User Interface.
// Currently, it is used to control the Sidebar's visibility (Open/Closed).

"use client"; // This component runs on the client-side (browser)

import React, { createContext, useContext, useState } from "react";

// 1. DEFINE THE SHAPE OF THE CONTEXT
// ----------------------------------------------------------------------------
// We define an interface to specify what data and functions are available within this context.
interface UIContextType {
    isSidebarOpen: boolean;                  // The current state of the sidebar (true = open, false = closed)
    setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void; // A function to directly set the state
    toggleSidebar: () => void;               // A helper function to flip the state (open <-> close)

    // Settings Modal
    isSettingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;

    // Task Modal
    isTaskModalOpen: boolean;
    setTaskModalOpen: (open: boolean) => void;
}

// 2. CREATE THE CONTEXT
// ----------------------------------------------------------------------------
// We create the Context object. Initially, it is undefined because we haven't provided a value yet.
const UIContext = createContext<UIContextType | undefined>(undefined);

// 3. CREATE THE PROVIDER COMPONENT
// ----------------------------------------------------------------------------
// This component wraps our app (or parts of it) and "provides" the state to all children.
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // We use a standard React useState hook to manage the boolean flag.
    const [isSidebarOpen, setSidebarOpenState] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);

    // Wrapper to support both direct value and function
    const setSidebarOpen = (value: boolean | ((prev: boolean) => boolean)) => {
        if (typeof value === "function") {
            setSidebarOpenState(value);
        } else {
            setSidebarOpenState(value);
        }
    };

    // Helper function to easily toggle the sidebar without needing to know the current state.
    const toggleSidebar = () => setSidebarOpenState((prev) => !prev);

    // We pass these values into the Provider.
    // Any component inside this provider can now access: isSidebarOpen, setSidebarOpen, toggleSidebar.
    return (
        <UIContext.Provider value={{
            isSidebarOpen,
            setSidebarOpen,
            toggleSidebar,
            isSettingsOpen,
            setSettingsOpen,
            isTaskModalOpen,
            setTaskModalOpen
        }}>
            {children}
        </UIContext.Provider>
    );
};

// 4. CUSTOM HOOK FOR EASY ACCESS
// ----------------------------------------------------------------------------
// Instead of importing useContext and UIContext in every component, we create a custom hook `useUI`.
// This also adds a safety check to ensure the hook is used within the Provider.
export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
};

