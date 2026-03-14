// ============================================================================
// VALIDATION SCHEMAS (Native TypeScript)
// ============================================================================
// Provides type-safe validation for all data structures in the application.
// Uses runtime validation without external dependencies.

// TimeBlock type
export type TimeBlock = "Dawn" | "Morning" | "Noon" | "Afternoon" | "Evening" | "Night";
const TIME_BLOCKS: TimeBlock[] = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];

// Day abbreviations
export type DayAbbreviation = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
const DAY_ABBREVIATIONS: DayAbbreviation[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Reminder options
export type ReminderOption = "5m" | "15m" | "30m" | "1h";
const REMINDER_OPTIONS: ReminderOption[] = ["5m", "15m", "30m", "1h"];

// Pattern matchers
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Task interface and validation
 */
export interface Task {
    id: string;
    title: string;
    icon: string;
    startTime: string;
    endTime: string;
    timeBlock: TimeBlock;
    days: DayAbbreviation[];
    isCompleted: boolean;
    lastCompletedDate?: string | null;
    completionHistory: string[];
    specificDate?: string;
    reminder?: ReminderOption;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validates a task object
 */
export function validateTask(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
        return { valid: false, errors: ["Task must be an object"] };
    }

    const task = data as Record<string, unknown>;

    // Required string fields
    if (typeof task.id !== "string" || !UUID_PATTERN.test(task.id)) {
        errors.push("Invalid task ID format (must be UUID)");
    }

    if (typeof task.title !== "string" || task.title.length === 0) {
        errors.push("Title is required");
    } else if (task.title.length > 100) {
        errors.push("Title must be 100 characters or less");
    }

    if (typeof task.icon !== "string") {
        errors.push("Icon must be a string");
    } else if (task.icon.length > 10) {
        errors.push("Icon must be 10 characters or less");
    }

    if (typeof task.startTime !== "string" || !TIME_PATTERN.test(task.startTime)) {
        errors.push("Invalid start time format (HH:mm)");
    }

    if (typeof task.endTime !== "string" || !TIME_PATTERN.test(task.endTime)) {
        errors.push("Invalid end time format (HH:mm)");
    }

    if (!TIME_BLOCKS.includes(task.timeBlock as TimeBlock)) {
        errors.push(`Invalid time block. Must be one of: ${TIME_BLOCKS.join(", ")}`);
    }

    if (!Array.isArray(task.days) || task.days.length === 0) {
        errors.push("At least one day must be selected");
    } else if (!task.days.every((d: unknown) => DAY_ABBREVIATIONS.includes(d as DayAbbreviation))) {
        errors.push("Invalid day abbreviation");
    }

    if (typeof task.isCompleted !== "boolean") {
        errors.push("isCompleted must be a boolean");
    }

    if (!Array.isArray(task.completionHistory)) {
        errors.push("completionHistory must be an array");
    }

    // Optional fields
    if (task.specificDate !== undefined && typeof task.specificDate === "string") {
        if (!DATE_PATTERN.test(task.specificDate)) {
            errors.push("Invalid specificDate format (YYYY-MM-DD)");
        }
    }

    if (task.reminder !== undefined && !REMINDER_OPTIONS.includes(task.reminder as ReminderOption)) {
        errors.push(`Invalid reminder. Must be one of: ${REMINDER_OPTIONS.join(", ")}`);
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Goal interface and validation
 */
export interface Goal {
    id: string;
    title: string;
    description?: string;
    emoji: string;
    category: string;
    priority: "low" | "medium" | "high";
    targetDate: string;
    milestones: Milestone[];
    createdAt: string;
    isCompleted: boolean;
}

export interface Milestone {
    id: string;
    title: string;
    targetDate: string;
    isCompleted: boolean;
}

/**
 * Validates a goal object
 */
export function validateGoal(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
        return { valid: false, errors: ["Goal must be an object"] };
    }

    const goal = data as Record<string, unknown>;

    if (typeof goal.title !== "string" || goal.title.length === 0) {
        errors.push("Goal title is required");
    } else if (goal.title.length > 100) {
        errors.push("Goal title must be 100 characters or less");
    }

    if (typeof goal.targetDate !== "string" || !DATE_PATTERN.test(goal.targetDate)) {
        errors.push("Invalid target date format (YYYY-MM-DD)");
    }

    if (typeof goal.isCompleted !== "boolean") {
        errors.push("isCompleted must be a boolean");
    }

    if (!["low", "medium", "high"].includes(goal.priority as string)) {
        errors.push("Priority must be low, medium, or high");
    }

    return { valid: errors.length === 0, errors };
}

/**
 * User stats interface
 */
export interface UserStats {
    score: number;
    email?: string;
    displayName?: string;
    photoURL?: string | null;
    totalCompleted: number;
    completionRate: number;
    streak: number;
    lastActive?: string;
}

/**
 * Validates user stats
 */
export function validateUserStats(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
        return { valid: false, errors: ["User stats must be an object"] };
    }

    const stats = data as Record<string, unknown>;

    if (typeof stats.score !== "number" || stats.score < 0) {
        errors.push("Score must be a non-negative number");
    }

    if (typeof stats.totalCompleted !== "number" || stats.totalCompleted < 0) {
        errors.push("totalCompleted must be a non-negative number");
    }

    if (typeof stats.completionRate !== "number" || stats.completionRate < 0 || stats.completionRate > 100) {
        errors.push("completionRate must be between 0 and 100");
    }

    if (typeof stats.streak !== "number" || stats.streak < 0) {
        errors.push("streak must be a non-negative number");
    }

    return { valid: errors.length === 0, errors };
}
