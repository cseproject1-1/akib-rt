"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { BadgeList } from "@/components/achievements/BadgeList";
import { LeaderboardList, LeaderboardUser } from "@/components/leaderboard/LeaderboardList";
import { UserRankCard } from "@/components/leaderboard/UserRankCard";
import { Trophy, Medal, Award } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";


export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Leaderboard Data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const usersRef = collection(db, "users");
        // Create a query against the collection.
        // NOTE: This requires an index in Firestore?
        // Simple query: Order by score descending, limit 50
        const q = query(usersRef, orderBy("score", "desc"), limit(50));
        const querySnapshot = await getDocs(q);

        const users: LeaderboardUser[] = [];
        let rank = 1;

        querySnapshot.forEach((doc) => {
          const data = doc.data() as {
            displayName?: string;
            username?: string;
            photoURL?: string;
            score?: number;
            streak?: number;
            completionRate?: number;
            totalCompleted?: number;
            isPublic?: boolean;
          };

          const isPublic = data.isPublic ?? true; // Default to public

          // Only include if public
          if (isPublic) {
            users.push({
              name: data.displayName || "Anonymous",
              username: data.username || "User",
              avatar: data.photoURL,
              rank: 0, // rank assigned after sort
              isCurrentUser: user?.uid === doc.id,
              streak: data.streak || 0,
              completionRate: data.completionRate || 0,
              totalCompleted: data.totalCompleted || 0,
              score: data.score || 0,
            });
          }
        });

        // Re-sort and assign ranks (client-side sort ensures correctness after filter)
        users.sort((a, b) => (b.score || 0) - (a.score || 0));
        users.forEach((u, index) => u.rank = index + 1);

        setLeaderboardData(users);
      } catch (error: any) {
        console.error("Error fetching leaderboard:", error);
        if (error?.code === 'permission-denied') {
          console.error("Check your Firestore Security Rules. You might need to deploy them: firebase deploy --only firestore");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const currentUserData = leaderboardData.find(u => u.isCurrentUser);
  const currentUserRank = currentUserData?.rank || 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 pt-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-500/10 rounded-2xl">
              <Trophy className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-1">Leaderboard</h2>
              <p className="text-muted-foreground">
                Compete with other productivity enthusiasts
              </p>
            </div>
          </div>
        </div>

        {/* User Rank Card */}
        {user && (
          <div className="mb-8">
            <UserRankCard rank={currentUserRank || 0} totalUsers={leaderboardData.length || 0} />
          </div>
        )}

        {/* Top Performers */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Top Performers
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-10 text-muted-foreground animate-pulse">Loading rankings...</div>
          ) : (
            <LeaderboardList users={leaderboardData} currentUserRank={currentUserRank} />
          )}
        </div>

        {/* Achievements Section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Achievements
            </h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Unlock badges by staying consistent with your routines.
          </p>
          <BadgeList />
        </div>
      </main>
    </div>
  );
}
