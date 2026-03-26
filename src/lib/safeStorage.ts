// ============================================================================
// SAFE STORAGE UTILITY
// ============================================================================
// Provides iframe-safe localStorage/sessionStorage access that gracefully
// handles blocked storage (common in cross-origin iframes, Safari ITP, etc.)

const isBrowser = typeof window !== "undefined";

// In-memory fallback storage when localStorage is blocked
const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  /**
   * Get item from storage with fallback to memory
   * Returns null if storage is blocked or key doesn't exist
   */
  getItem(key: string): string | null {
    if (!isBrowser) return null;

    try {
      return localStorage.getItem(key);
    } catch (e) {
      // localStorage blocked (iframe, Safari ITP, etc.)
      console.warn(`[safeStorage] localStorage.getItem blocked for key "${key}":`, e);
      return memoryStorage[key] ?? null;
    }
  },

  /**
   * Set item in storage with fallback to memory
   * Returns true if successful, false if storage is blocked
   */
  setItem(key: string, value: string): boolean {
    if (!isBrowser) return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      // localStorage blocked - use memory fallback
      console.warn(`[safeStorage] localStorage.setItem blocked for key "${key}":`, e);
      memoryStorage[key] = value;
      return false;
    }
  },

  /**
   * Remove item from storage (and memory fallback)
   * Returns true if successful
   */
  removeItem(key: string): boolean {
    if (!isBrowser) return false;

    try {
      localStorage.removeItem(key);
      delete memoryStorage[key];
      return true;
    } catch (e) {
      console.warn(`[safeStorage] localStorage.removeItem blocked for key "${key}":`, e);
      delete memoryStorage[key];
      return false;
    }
  },

  /**
   * Check if localStorage is available
   * Returns false in iframes or browsers that block storage
   */
  isAvailable(): boolean {
    if (!isBrowser) return false;

    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Session storage variant with same safety guarantees
   */
  session: {
    getItem(key: string): string | null {
      if (!isBrowser) return null;

      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        console.warn(`[safeStorage] sessionStorage.getItem blocked for key "${key}":`, e);
        return null;
      }
    },

    setItem(key: string, value: string): boolean {
      if (!isBrowser) return false;

      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.warn(`[safeStorage] sessionStorage.setItem blocked for key "${key}":`, e);
        return false;
      }
    },

    removeItem(key: string): boolean {
      if (!isBrowser) return false;

      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (e) {
        console.warn(`[safeStorage] sessionStorage.removeItem blocked for key "${key}":`, e);
        return false;
      }
    },

    isAvailable(): boolean {
      if (!isBrowser) return false;

      try {
        const testKey = "__session_storage_test__";
        sessionStorage.setItem(testKey, testKey);
        sessionStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
};

export default safeStorage;
