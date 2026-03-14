"use client";

import { useState, useEffect } from "react";
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
import { useConfirm } from "@/components/ui/ConfirmDialog";
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
  const { confirm, ConfirmDialogComponent } = useConfirm();
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

    const confirmed = await confirm({
      title: "Delete this goal?",
      description: "This will permanently delete this goal and all its milestones. This action cannot be undone.",
      confirmText: "Delete Goal",
      cancelText: "Cancel",
      type: "danger"
    });

    if (confirmed) {
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
      <main className="container mx-auto max-w-5xl px-6 pt-16 pb-32">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-10 mb-20 border-b-8 border-foreground pb-12">
          <div className="space-y-4">
            <h2 className="text-8xl font-black tracking-tighter text-foreground flex items-center gap-6 uppercase italic leading-none">
              <Target className="h-20 w-20 text-primary stroke-[4] drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
              Goals
            </h2>
            <p className="text-2xl font-black uppercase tracking-tight text-muted-foreground italic max-w-xl leading-snug">
              Track your long-term ambitions and milestones with <span className="text-primary underline decoration-4 underline-offset-8">Atomic Precision</span>.
            </p>
          </div>
          <Button
            onClick={handleAddGoal}
            className="h-20 px-12 text-2xl font-black uppercase italic brutal-btn bg-primary text-primary-foreground brutal-shadow-lg hover:-translate-y-2 hover:brutal-glow transition-all active:translate-y-0 active:shadow-none"
          >
            <Plus className="mr-3 h-8 w-8 stroke-[4]" />
            New Goal
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="h-20 w-20 animate-spin brutal-border border-4 border-t-primary" />
          </div>
        ) : goals.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-32 brutal-card bg-black border-foreground border-4 border-dashed brutal-shadow-lg">
            <div className="flex h-32 w-32 items-center justify-center brutal-border border-4 bg-primary mb-10 brutal-shadow-lg brutal-glow rotate-3">
              <Target className="h-16 w-16 text-primary-foreground stroke-[4]" />
            </div>
            <h3 className="text-5xl font-black text-foreground mb-6 uppercase tracking-tighter italic">No Goals Yet</h3>
            <p className="text-2xl font-black text-muted-foreground text-center max-w-lg mb-12 uppercase tracking-tight italic leading-relaxed">
              Set your first goal and start tracking your progress towards
              achieving your <span className="text-primary">Greatest Ambitions</span>.
            </p>
            <Button
              onClick={handleAddGoal}
              className="h-20 px-12 text-2xl font-black uppercase italic brutal-btn bg-primary text-primary-foreground brutal-shadow-lg hover:-translate-y-2 hover:brutal-glow transition-all"
            >
              <Plus className="mr-3 h-8 w-8 stroke-[4]" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Timeline Section */}
            <GoalTimeline goals={goals} onGoalClick={handleEditGoal} />

            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-foreground uppercase tracking-[0.3em] italic flex items-center gap-5">
                  <span className="h-3 w-16 bg-primary brutal-glow"></span>
                  Active Goals ({activeGoals.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-muted-foreground uppercase tracking-[0.3em] italic flex items-center gap-5">
                  <span className="h-3 w-16 bg-green-500"></span>
                  Completed ({completedGoals.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-80 hover:opacity-100 transition-opacity">
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

      {ConfirmDialogComponent}
    </div>
  );
}
