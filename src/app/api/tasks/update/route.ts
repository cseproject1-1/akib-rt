// ============================================================================
// TASKS API - UPDATE TASK
// ============================================================================
// PUT /api/tasks/update
// Updates an existing task for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { withRateLimit } from "@/lib/rateLimit";
import { sanitizeTaskInput } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

export async function PUT(request: NextRequest) {
    const rateLimitResponse = withRateLimit(request, { maxRequests: 30, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { userId, taskId, updates } = body;

        if (!userId || !taskId) {
            return NextResponse.json({ error: "User ID and Task ID are required" }, { status: 400 });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "Updates are required" }, { status: 400 });
        }

        // Sanitize the updates
        const sanitizedUpdates = sanitizeTaskInput(updates) || {};

        // Add timestamp and create final updates object
        const finalUpdates: Record<string, unknown> = {
            ...sanitizedUpdates,
            updatedAt: new Date().toISOString(),
        };

        // Remove undefined values
        Object.keys(finalUpdates).forEach(key => {
            if (finalUpdates[key] === undefined) {
                delete finalUpdates[key];
            }
        });

        // Update in Firestore
        await updateDoc(doc(db, "users", userId, "tasks", taskId), finalUpdates);

        logger.info("Task updated via API", {
            action: "PUT /api/tasks/update",
            metadata: { userId, taskId }
        });

        return NextResponse.json({
            success: true,
            taskId,
            updates: finalUpdates
        });

    } catch (error: any) {
        logger.apiError("/api/tasks/update", "PUT", error, 500);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
