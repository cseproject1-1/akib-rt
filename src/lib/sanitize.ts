// ============================================================================
// INPUT SANITIZATION UTILITIES
// ============================================================================
// Provides input sanitization for API endpoints to prevent XSS, injection attacks,
// and malformed data.

/**
 * Sanitize a string by removing/escaping dangerous characters
 */
export function sanitizeString(input: unknown): string {
    if (typeof input !== "string") {
        return "";
    }

    return input
        // Remove null bytes
        .replace(/\0/g, "")
        // Escape HTML entities to prevent XSS
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        // Remove control characters (except newlines and tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        // Trim whitespace
        .trim();
}

/**
 * Sanitize a string for plain text (no HTML needed)
 * More aggressive - strips all special chars
 */
export function sanitizePlainText(input: unknown): string {
    if (typeof input !== "string") {
        return "";
    }

    return input
        .replace(/[<>]/g, "") // Remove angle brackets
        .replace(/\0/g, "")   // Remove null bytes
        .trim();
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(input: unknown): string | null {
    if (typeof input !== "string") {
        return null;
    }

    const email = input.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return null;
    }

    return email;
}

/**
 * Sanitize a URL
 */
export function sanitizeUrl(input: unknown): string | null {
    if (typeof input !== "string") {
        return null;
    }

    try {
        const url = new URL(input.trim());
        // Only allow http and https protocols
        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }
        return url.toString();
    } catch {
        return null;
    }
}

/**
 * Sanitize a number (integer)
 */
export function sanitizeInteger(input: unknown, min?: number, max?: number): number | null {
    const num = typeof input === "string" ? parseInt(input, 10) : input;

    if (typeof num !== "number" || isNaN(num) || !isFinite(num)) {
        return null;
    }

    const integer = Math.floor(num);

    if (min !== undefined && integer < min) return null;
    if (max !== undefined && integer > max) return null;

    return integer;
}

/**
 * Sanitize a boolean
 */
export function sanitizeBoolean(input: unknown): boolean {
    if (typeof input === "boolean") {
        return input;
    }
    if (typeof input === "string") {
        return input.toLowerCase() === "true" || input === "1";
    }
    if (typeof input === "number") {
        return input === 1;
    }
    return false;
}

/**
 * Sanitize an array of strings
 */
export function sanitizeStringArray(
    input: unknown,
    options: { maxLength?: number; allowedValues?: string[] } = {}
): string[] {
    if (!Array.isArray(input)) {
        return [];
    }

    const { maxLength = 100, allowedValues } = options;

    return input
        .filter((item): item is string => typeof item === "string")
        .map(sanitizePlainText)
        .filter(item => item.length > 0 && item.length <= maxLength)
        .filter(item => !allowedValues || allowedValues.includes(item));
}

/**
 * Sanitize a date string (YYYY-MM-DD format)
 */
export function sanitizeDate(input: unknown): string | null {
    if (typeof input !== "string") {
        return null;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input)) {
        return null;
    }

    // Validate it's a real date
    const date = new Date(input);
    if (isNaN(date.getTime())) {
        return null;
    }

    return input;
}

/**
 * Sanitize a time string (HH:mm format)
 */
export function sanitizeTime(input: unknown): string | null {
    if (typeof input !== "string") {
        return null;
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(input)) {
        return null;
    }

    return input;
}

/**
 * Deep sanitize an object (recursively sanitize all string values)
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
            result[key] = sanitizePlainText(value);
        } else if (Array.isArray(value)) {
            result[key] = value.map(item =>
                typeof item === "string" ? sanitizePlainText(item) : item
            );
        } else if (value && typeof value === "object") {
            result[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            result[key] = value;
        }
    }

    return result as T;
}

/**
 * Sanitize task input data
 */
export function sanitizeTaskInput(input: unknown): Record<string, unknown> | null {
    if (!input || typeof input !== "object") {
        return null;
    }

    const data = input as Record<string, unknown>;
    const allowedDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const allowedTimeBlocks = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];

    return {
        title: sanitizePlainText(data.title)?.slice(0, 100) || "",
        icon: sanitizePlainText(data.icon)?.slice(0, 10) || "📝",
        startTime: sanitizeTime(data.startTime),
        endTime: sanitizeTime(data.endTime),
        timeBlock: allowedTimeBlocks.includes(data.timeBlock as string)
            ? data.timeBlock
            : "Morning",
        days: sanitizeStringArray(data.days, { allowedValues: allowedDays }),
        specificDate: sanitizeDate(data.specificDate) || undefined,
        reminder: ["5m", "15m", "30m", "1h"].includes(data.reminder as string)
            ? data.reminder
            : undefined,
    };
}
