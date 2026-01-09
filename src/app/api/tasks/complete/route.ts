// ============================================================================
// TASKS API - TOGGLE COMPLETION
// ============================================================================
// POST /api/tasks/complete
// Toggles task completion status and updates user stats

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, writeBatch, increment } from "firebase/firestore";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { format, subDays } from "date-fns";

interface Task {
    id: string;
    completionHistory: string[];
    days: string[];
    specificDate?: string;
}

export async function POST(request: NextRequest) {
    const rateLimitResponse = withRateLimit(request, { maxRequests: 60, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { userId, taskId, userInfo } = body;

        if (!userId || !taskId) {
            return NextResponse.json({ error: "User ID and Task ID are required" }, { status: 400 });
        }

        // Get current task state
        const taskRef = doc(db, "users", userId, "tasks", taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        const task = taskSnap.data() as Task;
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const isCurrentlyCompleted = task.completionHistory?.includes(todayStr) ?? false;

        // Calculate new history
        const newHistory = isCurrentlyCompleted
            ? task.completionHistory.filter((d: string) => d !== todayStr)
            : [...(task.completionHistory || []), todayStr];

        const updates = {
            completionHistory: newHistory,
            isCompleted: !isCurrentlyCompleted,
            lastCompletedDate: !isCurrentlyCompleted ? new Date().toISOString() : null,
        };

        // Batch update task and user stats
        const batch = writeBatch(db);

        batch.update(taskRef, updates);

        // Update user stats
        const userRef = doc(db, "users", userId);
        const scoreChange = !isCurrentlyCompleted ? 10 : -10;

        batch.set(userRef, {
            score: increment(scoreChange),
            email: userInfo?.email,
            displayName: userInfo?.displayName || userInfo?.email?.split('@')[0] || 'User',
            photoURL: userInfo?.photoURL || null,
            lastActive: new Date().toISOString()
        }, { merge: true });

        await batch.commit();

        logger.info("Task completion toggled via API", {
            action: "POST /api/tasks/complete",
            metadata: { userId, taskId, completed: !isCurrentlyCompleted }
        });

        return NextResponse.json({
            success: true,
            taskId,
            completed: !isCurrentlyCompleted,
            newHistory
        });

    } catch (error: any) {
        logger.apiError("/api/tasks/complete", "POST", error, 500);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
