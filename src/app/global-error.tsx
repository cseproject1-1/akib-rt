// ============================================================================
// GLOBAL ERROR BOUNDARY
// ============================================================================
// Catches unhandled errors in the root layout (including provider errors)
// This prevents the generic "client-side exception" overlay from Next.js

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error("[GlobalError] Unhandled client-side exception:", error);
    console.error("[GlobalError] Error stack:", error.stack);
    console.error("[GlobalError] Error digest:", error.digest);

    // Check if it's a storage-related error (common in iframes)
    const isStorageError =
      error.message?.includes("localStorage") ||
      error.message?.includes("sessionStorage") ||
      error.message?.includes("IndexedDB") ||
      error.message?.includes("storage") ||
      error.message?.includes("quota") ||
      error.message?.includes("DOMException");

    if (isStorageError) {
      console.warn("[GlobalError] Storage access blocked - likely running in iframe with restricted storage");
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            color: "#fff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              maxWidth: "500px",
              padding: "40px",
              borderRadius: "16px",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "20px",
              }}
            >
              ⚠️
            </div>

            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "12px",
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              The app encountered an unexpected error while loading.
            </p>

            {error.message && (
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: "24px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  wordBreak: "break-word",
                }}
              >
                {error.message}
              </p>
            )}

            <button
              onClick={() => reset()}
              style={{
                padding: "12px 32px",
                borderRadius: "8px",
                backgroundColor: "#8b5cf6",
                color: "#fff",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#7c3aed")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#8b5cf6")
              }
            >
              Try Again
            </button>

            <p
              style={{
                marginTop: "24px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              If this keeps happening, try opening the app directly instead of
              in an iframe.
            </p>

            {error.digest && (
              <p
                style={{
                  marginTop: "16px",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "monospace",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
