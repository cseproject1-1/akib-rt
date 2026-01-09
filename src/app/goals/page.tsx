"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/Button";
import { GoalCard, Goal, Milestone } from "@/components/goals/GoalCard";
import { GoalModal } from "@/components/goals/GoalModal";
import { GoalTimeline } from "@/components/goals/GoalTimeline";
import { Plus, Target, LayoutGrid, CalendarDays } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { handleFirestoreError, withRetry } from "@/lib/firestoreUtils";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Firestore listener for goals
  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    const goalsRef = collection(db, "users", user.uid, "goals");
    const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
      const fetchedGoals = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Goal)
      );
      // Sort by target date
      fetchedGoals.sort((a, b) =>
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      );
      setGoals(fetchedGoals);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveGoal = async (
    goalData: Omit<Goal, "id" | "createdAt" | "isCompleted"> | Goal
  ) => {
    if (!user) return;

    try {
      if ("id" in goalData) {
        // Update existing goal
        await updateDoc(doc(db, "users", user.uid, "goals", goalData.id), {
          ...goalData,
        });
      } else {
        // Create new goal
        const newGoal: Goal = {
          ...goalData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          isCompleted: false,
        };
        await setDoc(doc(db, "users", user.uid, "goals", newGoal.id), newGoal);
      }
    } catch (error: any) {
      handleFirestoreError(error, "Save goal");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this goal?")) {
      await deleteDoc(doc(db, "users", user.uid, "goals", id));
    }
  };

  const handleToggleComplete = async (id: string) => {
    if (!user) return;
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    await updateDoc(doc(db, "users", user.uid, "goals", id), {
      isCompleted: !goal.isCompleted,
    });
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    if (!user) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
    );

    await updateDoc(doc(db, "users", user.uid, "goals", goalId), {
      milestones: updatedMilestones,
    });
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleAddGoal = () => {
    setGoalToEdit(undefined);
    setIsModalOpen(true);
  };

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 pt-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-400" />
              Goals
            </h2>
            <p className="text-muted-foreground mt-1">
              Track your long-term goals and milestones
            </p>
          </div>
          <Button
            onClick={handleAddGoal}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 h-12 rounded-2xl border-0 shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Goal
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          </div>
        ) : goals.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
              <Target className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Set your first goal and start tracking your progress towards
              achieving your dreams.
            </p>
            <Button
              onClick={handleAddGoal}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 h-12 rounded-2xl border-0"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  Active Goals ({activeGoals.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                      onToggleComplete={handleToggleComplete}
                      onToggleMilestone={handleToggleMilestone}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  Completed ({completedGoals.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={handleEditGoal}
                      onDelete={handleDeleteGoal}
                      onToggleComplete={handleToggleComplete}
                      onToggleMilestone={handleToggleMilestone}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGoal}
        goalToEdit={goalToEdit}
      />
    </div>
  );
}
