"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

export interface Goal {
    id: string;
    title: string;
    description: string;
    targetDate: string;
    isCompleted: boolean;
    category: string;
    progress: number; // 0-100
}

interface GoalContextType {
    goals: Goal[];
    addGoal: (goal: Omit<Goal, "id" | "isCompleted" | "progress">) => Promise<void>;
    updateGoal: (goal: Goal) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    toggleGoalCompletion: (id: string) => Promise<void>;
    loading: boolean;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setGoals([]);
            setLoading(false);
            return;
        }

        const goalsRef = collection(db, "users", user.uid, "goals");
        const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
            const fetchedGoals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Goal));
            setGoals(fetchedGoals);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addGoal = async (goalData: Omit<Goal, "id" | "isCompleted" | "progress">) => {
        if (!user) return;
        const newGoal: Goal = {
            ...goalData,
            id: uuidv4(),
            isCompleted: false,
            progress: 0,
        };
        await setDoc(doc(db, "users", user.uid, "goals", newGoal.id), newGoal);
    };

    const updateGoal = async (updatedGoal: Goal) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "goals", updatedGoal.id), { ...updatedGoal });
    };

    const deleteGoal = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "goals", id));
    };

    const toggleGoalCompletion = async (id: string) => {
        if (!user) return;
        const goal = goals.find((g) => g.id === id);
        if (!goal) return;
        await updateDoc(doc(db, "users", user.uid, "goals", id), {
            isCompleted: !goal.isCompleted,
            progress: !goal.isCompleted ? 100 : 0,
        });
    };

    return (
        <GoalContext.Provider value={{ goals, addGoal, updateGoal, deleteGoal, toggleGoalCompletion, loading }}>
            {children}
        </GoalContext.Provider>
    );
};

export const useGoal = () => {
    const context = useContext(GoalContext);
    if (context === undefined) {
        throw new Error("useGoal must be used within a GoalProvider");
    }
    return context;
};
