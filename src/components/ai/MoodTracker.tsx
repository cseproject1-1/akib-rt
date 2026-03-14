"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { format, subDays } from "date-fns";
import { Smile, Meh, Frown, Sparkles, TrendingUp, Calendar } from "lucide-react";

const MOODS = [
    { id: 1, emoji: "😔", label: "Rough", color: "from-red-500 to-orange-500" },
    { id: 2, emoji: "😕", label: "Low", color: "from-orange-500 to-yellow-500" },
    { id: 3, emoji: "😐", label: "Okay", color: "from-yellow-500 to-lime-500" },
    { id: 4, emoji: "🙂", label: "Good", color: "from-lime-500 to-green-500" },
    { id: 5, emoji: "😊", label: "Great", color: "from-green-500 to-emerald-500" },
];

interface MoodEntry {
    date: string;
    mood: number;
    note?: string;
    timestamp: string;
}

export const MoodTracker: React.FC = () => {
    const { user } = useAuth();
    const [todayMood, setTodayMood] = useState<number | null>(null);
    const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
    const [note, setNote] = useState("");
    const [showNote, setShowNote] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const today = format(new Date(), "yyyy-MM-dd");

    // Load today's mood and recent history
    useEffect(() => {
        if (!user) return;

        const loadMoods = async () => {
            try {
                // Get today's mood
                const todayRef = doc(db, "users", user.uid, "moods", today);
                const todaySnap = await getDoc(todayRef);
                if (todaySnap.exists()) {
                    const data = todaySnap.data() as MoodEntry;
                    setTodayMood(data.mood);
                    setNote(data.note || "");
                }

                // Get last 7 days
                const moodsRef = collection(db, "users", user.uid, "moods");
                const q = query(moodsRef, orderBy("date", "desc"), limit(7));
                const snapshot = await getDocs(q);
                const moods = snapshot.docs.map(d => d.data() as MoodEntry);
                setRecentMoods(moods);
            } catch (error) {
                console.error("Failed to load moods:", error);
            }
        };

        loadMoods();
    }, [user, today]);

    const saveMood = async (moodValue: number) => {
        if (!user) return;

        setIsSaving(true);
        setTodayMood(moodValue);

        try {
            const moodEntry: MoodEntry = {
                date: today,
                mood: moodValue,
                note: note,
                timestamp: new Date().toISOString(),
            };

            await setDoc(doc(db, "users", user.uid, "moods", today), moodEntry);

            // Update recent moods
            setRecentMoods(prev => {
                const filtered = prev.filter(m => m.date !== today);
                return [moodEntry, ...filtered].slice(0, 7);
            });
        } catch (error) {
            console.error("Failed to save mood:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate average mood
    const avgMood = recentMoods.length > 0
        ? Math.round(recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length * 10) / 10
        : 0;

    // Get mood trend
    const getMoodTrend = () => {
        if (recentMoods.length < 2) return "stable";
        const recent = recentMoods.slice(0, 3).reduce((sum, m) => sum + m.mood, 0) / Math.min(3, recentMoods.length);
        const older = recentMoods.slice(3).reduce((sum, m) => sum + m.mood, 0) / Math.max(1, recentMoods.length - 3);
        if (recent > older + 0.5) return "up";
        if (recent < older - 0.5) return "down";
        return "stable";
    };

    const trend = getMoodTrend();

    return (
        <div className="rounded-3xl bg-card border border-border p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Smile className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-foreground">Mood Check-In</h3>
                    <p className="text-xs text-muted-foreground">How are you feeling today?</p>
                </div>
            </div>

            {/* Mood Selector */}
            <div className="mb-6">
                <div className="flex justify-between gap-2">
                    {MOODS.map((mood) => {
                        const isSelected = todayMood === mood.id;
                        return (
                            <button
                                key={mood.id}
                                onClick={() => saveMood(mood.id)}
                                disabled={isSaving}
                                className={`
                  flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all
                  ${isSelected
                                        ? `bg-gradient-to-br ${mood.color} text-white shadow-lg scale-105`
                                        : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                                    }
                `}
                            >
                                <span className="text-2xl">{mood.emoji}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">{mood.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Note (optional) */}
            {todayMood && (
                <div className="mb-6">
                    {!showNote ? (
                        <button
                            onClick={() => setShowNote(true)}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            + Add a note about today
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="How was your day? (optional)"
                                className="w-full h-20 bg-white/5 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                            <button
                                onClick={() => saveMood(todayMood)}
                                disabled={isSaving}
                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Save note
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        <span className="text-lg font-bold text-foreground">{avgMood || "-"}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">7-Day Avg</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        {trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : trend === "down" ? (
                            <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
                        ) : (
                            <div className="h-4 w-4 flex items-center justify-center text-muted-foreground">—</div>
                        )}
                        <span className={`text-lg font-bold ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-foreground"
                            }`}>
                            {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
                        </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Trend</span>
                </div>
            </div>

            {/* Recent Moods Timeline */}
            {recentMoods.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        This Week
                    </h4>
                    <div className="flex justify-between">
                        {Array.from({ length: 7 }, (_, i) => {
                            const date = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
                            const dayMood = recentMoods.find(m => m.date === date);
                            const mood = dayMood ? MOODS.find(m => m.id === dayMood.mood) : null;
                            const isToday = date === today;

                            return (
                                <div key={date} className="flex flex-col items-center">
                                    <div className={`
                    h-8 w-8 rounded-lg flex items-center justify-center text-sm
                    ${mood ? `bg-gradient-to-br ${mood.color}` : "bg-white/5"}
                    ${isToday ? "ring-2 ring-purple-500/50" : ""}
                  `}>
                                        {mood ? mood.emoji : "·"}
                                    </div>
                                    <span className={`text-[9px] mt-1 ${isToday ? "text-purple-400 font-bold" : "text-muted-foreground"}`}>
                                        {format(subDays(new Date(), 6 - i), "EEE")[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
