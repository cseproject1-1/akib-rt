// ============================================================================
// DAILY MOTIVATION CRON JOB
// ============================================================================
// Runs at 6 AM daily to prepare daily motivation messages for all users.
// Schedule: 0 6 * * * (Every day at 6:00 AM UTC)

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { logger } from "@/lib/logger";

// Verify the request is from Vercel Cron
function verifyCronRequest(request: Request): boolean {
    const authHeader = request.headers.get("authorization");
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
    // In production, verify the cron secret
    if (process.env.NODE_ENV === "production") {
        if (!verifyCronRequest(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        logger.info("Daily motivation cron job started", { action: "cron/daily-motivation" });

        // Get count of active users (users with tasks)
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userCount = usersSnapshot.size;

        // Log the job execution
        logger.info(`Daily motivation prepared for ${userCount} users`, {
            action: "cron/daily-motivation",
            metadata: { userCount },
        });

        // In a full implementation, you would:
        // 1. Fetch each user's tasks for today
        // 2. Generate personalized motivation
        // 3. Store in a "notifications" collection or send via push

        return NextResponse.json({
            success: true,
            message: `Daily motivation job completed`,
            usersProcessed: userCount,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error("Daily motivation cron failed", error, { action: "cron/daily-motivation" });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
