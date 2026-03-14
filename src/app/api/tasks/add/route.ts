// ============================================================================
// TASKS API - ADD TASK
// ============================================================================
// POST /api/tasks/add
// Creates a new task for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { withRateLimit } from "@/lib/rateLimit";
import { sanitizeTaskInput } from "@/lib/sanitize";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
    // Rate limiting: 30 requests per minute
    const rateLimitResponse = withRateLimit(request, { maxRequests: 30, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { userId, taskData } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        if (!taskData) {
            return NextResponse.json({ error: "Task data is required" }, { status: 400 });
        }

        // Sanitize input
        const sanitizedData = sanitizeTaskInput(taskData);
        if (!sanitizedData || !sanitizedData.title) {
            return NextResponse.json({ error: "Invalid task data" }, { status: 400 });
        }

        // Create new task with generated ID
        const newTask = {
            id: uuidv4(),
            ...sanitizedData,
            isCompleted: false,
            completionHistory: [],
            createdAt: new Date().toISOString(),
        };

        // Save to Firestore
        await setDoc(doc(db, "users", userId, "tasks", newTask.id), newTask);

        logger.info("Task created via API", {
            action: "POST /api/tasks/add",
            metadata: { userId, taskId: newTask.id }
        });

        return NextResponse.json({
            success: true,
            task: newTask
        });

    } catch (error: any) {
        logger.apiError("/api/tasks/add", "POST", error, 500);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
