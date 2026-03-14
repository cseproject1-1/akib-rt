// ============================================================================
// FIRESTORE UTILITY FUNCTIONS
// ============================================================================
// Provides retry logic, error handling, and centralized Firestore operations.

import { toast } from "sonner";

// Firestore error codes that are safe to retry
const RETRYABLE_ERROR_CODES = [
    "unavailable",
    "deadline-exceeded",
    "resource-exhausted",
    "aborted",
    "internal",
];

/**
 * Wraps a Firestore operation with retry logic and exponential backoff.
 * 
 * @param operation - The async Firestore operation to execute
 * @param options - Configuration options
 * @returns The result of the operation
 * @throws The last error if all retries fail
 * 
 * @example
 * ```ts
 * await withRetry(
 *   () => setDoc(docRef, data),
 *   { operationName: "Add task" }
 * );
 * ```
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelayMs?: number;
        operationName?: string;
        silent?: boolean;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelayMs = 500,
        operationName = "Operation",
        silent = false,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Check if this is a retryable error
            const isRetryable = RETRYABLE_ERROR_CODES.includes(error?.code);

            if (!isRetryable || attempt === maxRetries) {
                // Non-retryable error or final attempt - throw immediately
                throw error;
            }

            // Calculate exponential backoff delay
            const delay = baseDelayMs * Math.pow(2, attempt);

            if (!silent) {
                console.log(
                    `[Firestore] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}). ` +
                    `Retrying in ${delay}ms...`,
                    error?.code || error?.message
                );
            }

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Handles Firestore errors with user-friendly toast notifications.
 * 
 * @param error - The error object from Firestore
 * @param context - Description of what operation failed
 */
export function handleFirestoreError(
    error: any,
    context: string = "Operation"
): void {
    console.error(`[Firestore Error] ${context}:`, error);

    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
        "permission-denied": `${context} denied. Please check your permissions or sign in again.`,
        "not-found": `${context} - The requested data was not found.`,
        "already-exists": `${context} - This item already exists.`,
        "failed-precondition": `${context} failed due to a conflict. Please try again.`,
        "aborted": `${context} was interrupted. Please try again.`,
        "unavailable": `Service temporarily unavailable. Check your internet connection.`,
        "deadline-exceeded": `${context} timed out. Please try again.`,
        "resource-exhausted": `Too many requests. Please wait a moment and try again.`,
        "internal": `An unexpected error occurred. Please try again later.`,
        "unauthenticated": `Please sign in to continue.`,
        "invalid-argument": `${context} - Invalid data provided.`,
        "cancelled": `${context} was cancelled.`,
        "data-loss": `${context} - Data loss detected. Please contact support.`,
        "unknown": `${context} - An unknown error occurred.`,
    };

    const errorCode = error?.code?.replace("firestore/", "") || "unknown";
    const userMessage = errorMessages[errorCode] || `${context} failed: ${error?.message || "Unknown error"}`;

    // Special handling for permission denied (common during setup)
    if (errorCode === "permission-denied") {
        toast.error(userMessage, {
            description: "Check Firebase Console → Firestore → Rules",
            duration: 6000,
        });
        return;
    }

    toast.error(userMessage, {
        duration: 4000,
    });
}

/**
 * Shows a success toast notification.
 * 
 * @param message - The success message to display
 * @param description - Optional description
 */
export function showSuccess(message: string, description?: string): void {
    toast.success(message, {
        description,
        duration: 3000,
    });
}

/**
 * Shows an info toast notification.
 * 
 * @param message - The info message to display
 * @param description - Optional description
 */
export function showInfo(message: string, description?: string): void {
    toast.info(message, {
        description,
        duration: 3000,
    });
}

// ============================================================================
// OPTIMISTIC UI TOAST UTILITIES
// ============================================================================

/**
 * Shows an optimistic toast with loading → success → error state transitions.
 * Uses Sonner's promise-based toast for smooth UX.
 * 
 * @param operation - Async operation to execute
 * @param messages - Toast messages for each state
 * @returns The result of the operation
 * 
 * @example
 * ```ts
 * await showOptimisticToast(
 *   () => addTaskToFirestore(task),
 *   {
 *     loading: "Creating task...",
 *     success: "Task created! 🎉",
 *     error: "Failed to create task"
 *   }
 * );
 * ```
 */
export async function showOptimisticToast<T>(
    operation: () => Promise<T>,
    messages: {
        loading: string;
        success: string | ((data: T) => string);
        error?: string | ((error: any) => string);
    }
): Promise<T> {
    const toastPromise = toast.promise(
        operation(),
        {
            loading: messages.loading,
            success: messages.success,
            error: messages.error || "Operation failed",
            duration: 3000,
        }
    );

    // Use unwrap to get the actual promise result
    return toastPromise.unwrap();
}

/**
 * Shows a toast with an undo button for destructive actions.
 * The action is delayed by 5 seconds, giving users time to undo.
 * 
 * @param message - The toast message
 * @param onConfirm - Callback executed after delay if not undone
 * @param onUndo - Callback executed if user clicks undo
 * @returns Toast ID for manual dismissal if needed
 * 
 * @example
 * ```ts
 * showUndoableToast(
 *   "Task deleted",
 *   () => deleteFromFirestore(taskId),
 *   () => restoreTask(task)
 * );
 * ```
 */
export function showUndoableToast(
    message: string,
    onConfirm: () => void | Promise<void>,
    onUndo?: () => void | Promise<void>
): string | number {
    let undone = false;

    const toastId = toast.success(message, {
        duration: 5000,
        action: {
            label: "Undo",
            onClick: async () => {
                undone = true;
                toast.dismiss(toastId);

                if (onUndo) {
                    await onUndo();
                }

                toast.success("Action cancelled", {
                    duration: 2000,
                });
            },
        },
    });

    // Execute the destructive action after delay if not undone
    setTimeout(async () => {
        if (!undone) {
            await onConfirm();
        }
    }, 5000);

    return toastId;
}

/**
 * Shows a celebration toast with confetti emoji for achievements.
 * 
 * @param message - The celebration message
 * @param points - Optional points earned
 */
export function showCelebrationToast(
    message: string,
    points?: number
): void {
    const fullMessage = points
        ? `${message} +${points} points! 🎯`
        : `${message} 🎉`;

    toast.success(fullMessage, {
        duration: 3000,
        className: "celebration-toast",
    });
}

/**
 * Shows a sync progress toast that updates as items are processed.
 * 
 * @param total - Total number of items to sync
 * @returns Object with update and complete methods
 * 
 * @example
 * ```ts
 * const sync = showSyncProgressToast(5);
 * for (let i = 0; i < 5; i++) {
 *   await syncItem(items[i]);
 *   sync.update(i + 1);
 * }
 * sync.complete();
 * ```
 */
export function showSyncProgressToast(total: number) {
    let current = 0;

    const toastId = toast.loading(`Syncing changes... (0/${total})`, {
        duration: Infinity,
    });

    return {
        update: (completed: number) => {
            current = completed;
            toast.loading(`Syncing changes... (${completed}/${total})`, {
                id: toastId,
                duration: Infinity,
            });
        },
        complete: (success: boolean = true) => {
            toast.dismiss(toastId);
            if (success) {
                toast.success(`All changes synced! ✅`, {
                    duration: 3000,
                });
            } else {
                toast.error(`Some changes failed to sync`, {
                    description: "Please check your connection and try again",
                    duration: 5000,
                });
            }
        },
    };
}
