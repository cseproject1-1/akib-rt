// ============================================================================
// OFFLINE QUEUE & SYNC MANAGER
// ============================================================================
// Queues operations when offline and syncs when connection is restored.

import { toast } from "sonner";
import { showSyncProgressToast } from "./firestoreUtils";

// Operation types
export type OperationType = "ADD" | "UPDATE" | "DELETE" | "TOGGLE";

export interface PendingOperation {
    id: string;
    type: OperationType;
    collection: string;
    documentId: string;
    data?: Record<string, unknown>;
    timestamp: number;
    retryCount: number;
}

const STORAGE_KEY = "rt_pending_operations";
const MAX_RETRIES = 5;

/**
 * Get all pending operations from localStorage
 */
export function getPendingOperations(): PendingOperation[] {
    if (typeof window === "undefined") return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save pending operations to localStorage
 */
function savePendingOperations(operations: PendingOperation[]): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
        console.error("Failed to save pending operations:", error);
    }
}

/**
 * Add an operation to the pending queue
 */
export function queueOperation(operation: Omit<PendingOperation, "id" | "timestamp" | "retryCount">): void {
    const operations = getPendingOperations();

    const newOperation: PendingOperation = {
        ...operation,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
    };

    operations.push(newOperation);
    savePendingOperations(operations);

    console.log(`[OfflineQueue] Queued ${operation.type} operation for ${operation.documentId}`);
}

/**
 * Remove a completed operation from the queue
 */
export function removeOperation(operationId: string): void {
    const operations = getPendingOperations();
    const filtered = operations.filter(op => op.id !== operationId);
    savePendingOperations(filtered);
}

/**
 * Mark operation as failed (increment retry count)
 */
export function markOperationFailed(operationId: string): boolean {
    const operations = getPendingOperations();
    const operation = operations.find(op => op.id === operationId);

    if (operation) {
        operation.retryCount++;

        if (operation.retryCount >= MAX_RETRIES) {
            // Remove permanently failed operation
            const filtered = operations.filter(op => op.id !== operationId);
            savePendingOperations(filtered);
            return false; // Operation permanently failed
        }

        savePendingOperations(operations);
        return true; // Will retry
    }

    return false;
}

/**
 * Clear all pending operations
 */
export function clearAllOperations(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if there are pending operations
 */
export function hasPendingOperations(): boolean {
    return getPendingOperations().length > 0;
}

/**
 * Get count of pending operations
 */
export function getPendingCount(): number {
    return getPendingOperations().length;
}

// ============================================================================
// ONLINE/OFFLINE DETECTION
// ============================================================================

let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
let syncCallback: (() => Promise<void>) | null = null;

/**
 * Initialize online/offline listeners
 */
export function initializeOfflineDetection(onSync: () => Promise<void>): () => void {
    if (typeof window === "undefined") return () => { };

    syncCallback = onSync;

    const handleOnline = async () => {
        isOnline = true;
        console.log("[OfflineQueue] Connection restored");

        const pendingCount = getPendingCount();
        if (hasPendingOperations()) {
            toast.info("Connection restored", {
                description: `Preparing to sync ${pendingCount} pending changes...`,
                duration: 2000,
            });

            // Use the sync progress toast
            const syncProgress = showSyncProgressToast(pendingCount);

            try {
                // Note: The actual sync logic should update progress
                // For now, we'll just call the callback
                await onSync();
                syncProgress.complete(true);
            } catch (error) {
                syncProgress.complete(false);
            }
        }
    };

    const handleOffline = () => {
        isOnline = false;
        console.log("[OfflineQueue] Connection lost");
        toast.warning("You're offline", {
            description: "Changes will be saved and synced when you reconnect.",
            duration: 5000,
        });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Return cleanup function
    return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        syncCallback = null;
    };
}

/**
 * Check if currently online
 */
export function getOnlineStatus(): boolean {
    return isOnline;
}

/**
 * Check if we should queue instead of executing directly
 */
export function shouldQueueOperation(): boolean {
    return !isOnline;
}
