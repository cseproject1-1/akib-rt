// ============================================================================
// LEADERBOARD API - GET RANKINGS
// ============================================================================
// GET /api/leaderboard/rankings
// Returns top users sorted by score

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { withRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

interface LeaderboardUser {
    id: string;
    displayName: string;
    photoURL?: string;
    score: number;
    streak: number;
    completionRate: number;
    totalCompleted: number;
}

export async function GET(request: NextRequest) {
    const rateLimitResponse = withRateLimit(request, { maxRequests: 30, windowMs: 60000 });
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { searchParams } = new URL(request.url);
        const limitCount = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
        const currentUserId = searchParams.get("userId");

        // Get top users by score
        const usersQuery = query(
            collection(db, "users"),
            orderBy("score", "desc"),
            limit(limitCount)
        );

        const usersSnapshot = await getDocs(usersQuery);

        const rankings: LeaderboardUser[] = usersSnapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
                id: doc.id,
                rank: index + 1,
                displayName: data.displayName || data.email?.split('@')[0] || 'Anonymous',
                photoURL: data.photoURL || null,
                score: data.score || 0,
                streak: data.streak || 0,
                completionRate: data.completionRate || 0,
                totalCompleted: data.totalCompleted || 0,
                isCurrentUser: doc.id === currentUserId,
            };
        });

        // Find current user's rank if not in top list
        let currentUserRank = null;
        if (currentUserId) {
            const userInList = rankings.find(u => u.id === currentUserId);
            if (userInList) {
                currentUserRank = rankings.indexOf(userInList) + 1;
            }
        }

        logger.info("Leaderboard fetched via API", {
            action: "GET /api/leaderboard/rankings",
            metadata: { count: rankings.length }
        });

        return NextResponse.json({
            success: true,
            rankings,
            currentUserRank,
            total: rankings.length
        });

    } catch (error: any) {
        logger.apiError("/api/leaderboard/rankings", "GET", error, 500);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
