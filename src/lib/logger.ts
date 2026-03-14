// ============================================================================
// CENTRALIZED ERROR LOGGING SERVICE
// ============================================================================
// Provides structured error logging with context, ready for integration with
// external services like Sentry, LogRocket, or custom analytics.

type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

interface ErrorContext {
    userId?: string;
    action?: string;
    component?: string;
    metadata?: Record<string, unknown>;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    error?: Error | unknown;
    context?: ErrorContext;
    stack?: string;
}

// In-memory log buffer (for development/debugging)
const LOG_BUFFER_SIZE = 100;
const logBuffer: LogEntry[] = [];

/**
 * Main logging function
 */
function log(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    context?: ErrorContext
): void {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        error,
        context,
        stack: error instanceof Error ? error.stack : undefined,
    };

    // Add to buffer (circular)
    logBuffer.push(entry);
    if (logBuffer.length > LOG_BUFFER_SIZE) {
        logBuffer.shift();
    }

    // Console output with styling
    const styles = {
        debug: "color: gray",
        info: "color: blue",
        warn: "color: orange",
        error: "color: red",
        critical: "color: white; background: red; font-weight: bold",
    };

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;

    if (typeof window !== "undefined") {
        // Client-side logging
        console.log(`%c${prefix} ${message}`, styles[level], context || "");
        if (error) {
            console.error(error);
        }
    } else {
        // Server-side logging (plain text)
        console.log(`${prefix} ${message}`, context ? JSON.stringify(context) : "");
        if (error) {
            console.error(error);
        }
    }

    // TODO: Send to external service (Sentry, LogRocket, etc.)
    // if (level === "error" || level === "critical") {
    //   sendToSentry(entry);
    // }
}

/**
 * Logger API
 */
export const logger = {
    debug: (message: string, context?: ErrorContext) =>
        log("debug", message, undefined, context),

    info: (message: string, context?: ErrorContext) =>
        log("info", message, undefined, context),

    warn: (message: string, error?: Error | unknown, context?: ErrorContext) =>
        log("warn", message, error, context),

    error: (message: string, error?: Error | unknown, context?: ErrorContext) =>
        log("error", message, error, context),

    critical: (message: string, error?: Error | unknown, context?: ErrorContext) =>
        log("critical", message, error, context),

    /**
     * Log a Firestore operation error with context
     */
    firestoreError: (
        operation: string,
        error: unknown,
        userId?: string,
        documentId?: string
    ) => {
        log("error", `Firestore ${operation} failed`, error, {
            userId,
            action: operation,
            component: "Firestore",
            metadata: { documentId },
        });
    },

    /**
     * Log an API request error
     */
    apiError: (
        endpoint: string,
        method: string,
        error: unknown,
        statusCode?: number
    ) => {
        log("error", `API ${method} ${endpoint} failed`, error, {
            action: `${method} ${endpoint}`,
            component: "API",
            metadata: { statusCode },
        });
    },

    /**
     * Get recent logs (for debugging)
     */
    getRecentLogs: (count: number = 20): LogEntry[] => {
        return logBuffer.slice(-count);
    },

    /**
     * Clear log buffer
     */
    clearLogs: () => {
        logBuffer.length = 0;
    },
};

/**
 * Helper to wrap async functions with automatic error logging
 */
export function withLogging<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context: { action: string; component: string }
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            logger.error(`${context.action} failed`, error, context);
            throw error;
        }
    }) as T;
}
