// ============================================================================
// TASKS API - DELETE TASK
// ============================================================================
// DELETE /api/tasks/delete
// Deletes a task for the authenticated user

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function DELETE(request: NextRequest) {
    const rateLimitResponse = withRateLimit(request, { maxRequests: 30, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await request.json();
        const { userId, taskId } = body;

        if (!userId || !taskId) {
            return NextResponse.json({ error: "User ID and Task ID are required" }, { status: 400 });
        }

        // Delete from Firestore
        await deleteDoc(doc(db, "users", userId, "tasks", taskId));

        logger.info("Task deleted via API", {
            action: "DELETE /api/tasks/delete",
            metadata: { userId, taskId }
        });

        return NextResponse.json({
            success: true,
            taskId,
            message: "Task deleted successfully"
        });

    } catch (error: any) {
        logger.apiError("/api/tasks/delete", "DELETE", error, 500);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
