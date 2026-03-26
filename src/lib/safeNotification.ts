// ============================================================================
// SAFE NOTIFICATION UTIFICATION
// ============================================================================
// Provides iframe-safe Notification API access that gracefully handles
// cases where Notification is undefined (iframes, private browsing, etc.)

const isBrowser = typeof window !== "undefined";

export const safeNotification = {
  /**
   * Check if Notification API is available
   */
  isAvailable(): boolean {
    return isBrowser && "Notification" in window;
  },

  /**
   * Get current permission status
   * Returns "default" if Notification is unavailable
   */
  get permission(): NotificationPermission {
    if (!this.isAvailable()) {
      return "default";
    }
    try {
      return window.Notification.permission;
    } catch {
      return "default";
    }
  },

  /**
   * Request notification permission
   * Returns "denied" if Notification is unavailable
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isAvailable()) {
      return "denied";
    }
    try {
      return await window.Notification.requestPermission();
    } catch {
      return "denied";
    }
  },

  /**
   * Show a notification
   * Returns null if Notification is unavailable or permission not granted
   */
  show(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isAvailable()) {
      return null;
    }
    try {
      if (window.Notification.permission !== "granted") {
        return null;
      }
      return new window.Notification(title, options);
    } catch {
      return null;
    }
  },

  /**
   * Check if notifications are granted
   */
  isGranted(): boolean {
    return this.isAvailable() && this.permission === "granted";
  }
};

export default safeNotification;
