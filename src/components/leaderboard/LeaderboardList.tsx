"use client";

import React from "react";
import { cn } from "@/components/ui/Button";
import { Trophy, Medal, Flame, TrendingUp } from "lucide-react";

export interface LeaderboardUser {
    rank: number;
    name: string;
    username: string; // New field for unique handle
    avatar?: string; // Optional - may not always have a photo
    completionRate: number;
    streak: number;
    totalCompleted: number;
    isCurrentUser?: boolean;
    score?: number; // Added for sorting
}

interface LeaderboardListProps {
    users: LeaderboardUser[];
    currentUserRank?: number;
}

export const LeaderboardList: React.FC<LeaderboardListProps> = ({
    users,
    currentUserRank,
}) => {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30">
                        <Trophy className="h-5 w-5 text-white" />
                    </div>
                );
            case 2:
                return (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg shadow-gray-400/30">
                        <Medal className="h-5 w-5 text-white" />
                    </div>
                );
            case 3:
                return (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg shadow-amber-600/30">
                        <Medal className="h-5 w-5 text-white" />
                    </div>
                );
            default:
                return (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-muted-foreground">
                        {rank}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-3">
            {users.map((user) => (
                <div
                    key={user.rank}
                    className={cn(
                        "group flex items-center gap-4 p-4 rounded-2xl border transition-all",
                        user.isCurrentUser
                            ? "border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10"
                            : "border-white/5 bg-white/[0.03] hover:bg-white/[0.05]"
                    )}
                >
                    {/* Rank */}
                    {getRankIcon(user.rank)}

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-2xl shrink-0 overflow-hidden relative">
                            {/* Safe Rendering Logic:
                                1. If avatar > 4 chars (likely URL), try Image. Fallback to Initial on error.
                                2. If avatar <= 4 chars (likely Emoji), show Avatar.
                                3. If no avatar, show Initial.
                            */}
                            {user.avatar && user.avatar.length > 4 ? (
                                <>
                                    {/* Fallback Initial (Background) */}
                                    <span className="absolute inset-0 flex items-center justify-center select-none">
                                        {user.name?.[0]?.toUpperCase() || "👤"}
                                    </span>
                                    {/* Image (Foreground) */}
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="relative h-full w-full object-cover"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                </>
                            ) : (
                                user.avatar || user.name?.[0]?.toUpperCase() || "👤"
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-bold truncate",
                                    user.isCurrentUser ? "text-purple-400" : "text-white"
                                )}>
                                    {user.name}
                                </span>
                                {user.isCurrentUser && (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                                        You
                                    </span>
                                )}
                            </div>
                            {/* Username Display */}
                            <div className="text-xs text-muted-foreground font-medium mb-1">
                                @{user.username}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Flame className="h-3 w-3 text-orange-400" />
                                    {user.streak} day streak
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 shrink-0">
                        <div className="hidden sm:block text-right">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Tasks</div>
                            <div className="text-lg font-bold text-white">{user.totalCompleted}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Rate</div>
                            <div className={cn(
                                "text-lg font-bold",
                                user.completionRate >= 80 ? "text-green-400" :
                                    user.completionRate >= 60 ? "text-yellow-400" : "text-red-400"
                            )}>
                                {user.completionRate}%
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div >
    );
};

// Mock data generator for demonstration
export const MOCK_LEADERBOARD: LeaderboardUser[] = [
    { rank: 1, name: "Sarah J.", username: "@SarahJ99", avatar: "👩‍💻", completionRate: 98, streak: 45, totalCompleted: 892 },
    { rank: 2, name: "Mike C.", username: "@MikeCode", avatar: "🧑‍🔬", completionRate: 95, streak: 32, totalCompleted: 756 },
    { rank: 3, name: "Alex K.", username: "@AlexArt", avatar: "👨‍🎨", completionRate: 92, streak: 28, totalCompleted: 623 },
    { rank: 4, name: "Emma L.", username: "@EmmaTeach", avatar: "👩‍🏫", completionRate: 88, streak: 21, totalCompleted: 541 },
    { rank: 5, name: "Jordan T.", username: "@JordyBiz", avatar: "🧑‍💼", completionRate: 85, streak: 19, totalCompleted: 489 },
    { rank: 6, name: "Chris P.", username: "@ChefChris", avatar: "👨‍🍳", completionRate: 82, streak: 15, totalCompleted: 412 },
    { rank: 7, name: "You", username: "@YouUser", avatar: "🌟", completionRate: 78, streak: 12, totalCompleted: 356, isCurrentUser: true },
    { rank: 8, name: "Taylor M.", username: "@TayMusic", avatar: "👩‍🎤", completionRate: 75, streak: 10, totalCompleted: 298 },
    { rank: 9, name: "Casey R.", username: "@CaseySpace", avatar: "🧑‍🚀", completionRate: 72, streak: 8, totalCompleted: 234 },
    { rank: 10, name: "Morgan B.", username: "@MoFix", avatar: "👨‍🔧", completionRate: 68, streak: 5, totalCompleted: 187 },
];
