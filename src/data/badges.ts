export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or Lucide icon name
  condition: (stats: { totalCompleted: number; maxStreak: number; tasksCount: number }) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "first_step",
    name: "First Step",
    description: "Complete your first task",
    icon: "🌱",
    condition: ({ totalCompleted }) => totalCompleted >= 1,
  },
  {
    id: "getting_serious",
    name: "Getting Serious",
    description: "Complete 10 tasks total",
    icon: "🚀",
    condition: ({ totalCompleted }) => totalCompleted >= 10,
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Reach a 3-day streak on any task",
    icon: "🔥",
    condition: ({ maxStreak }) => maxStreak >= 3,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Reach a 7-day streak on any task",
    icon: "⚔️",
    condition: ({ maxStreak }) => maxStreak >= 7,
  },
  {
    id: "routine_pro",
    name: "Routine Pro",
    description: "Have at least 5 active routines",
    icon: "📅",
    condition: ({ tasksCount }) => tasksCount >= 5,
  },
  {
    id: "two_week_champion",
    name: "Two Week Champion",
    description: "Maintain a 14-day streak",
    icon: "🏆",
    condition: ({ maxStreak }) => maxStreak >= 14,
  },
  {
    id: "monthly_master",
    name: "Monthly Master",
    description: "Reach a 30-day streak on any task",
    icon: "👑",
    condition: ({ maxStreak }) => maxStreak >= 30,
  },
  {
    id: "century_club",
    name: "Century Club",
    description: "Complete 100 tasks total",
    icon: "💯",
    condition: ({ totalCompleted }) => totalCompleted >= 100,
  },
  {
    id: "half_thousand",
    name: "High Achiever",
    description: "Complete 500 tasks total",
    icon: "🌟",
    condition: ({ totalCompleted }) => totalCompleted >= 500,
  },
  {
    id: "routine_master",
    name: "Routine Master",
    description: "Have at least 10 active routines",
    icon: "🎯",
    condition: ({ tasksCount }) => tasksCount >= 10,
  },
];
