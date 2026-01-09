// ============================================================================
// RATE LIMITING UTILITIES
// ============================================================================
// Provides rate limiting for API routes to prevent abuse and ensure fair usage.

import { NextRequest, NextResponse } from "next/server";

// In-memory store for rate limiting (for serverless, consider using Upstash Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    windowMs: number;     // Time window in milliseconds
    maxRequests: number;  // Maximum requests per window
    message?: string;     // Custom error message
}

const DEFAULT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,      // 60 requests per minute
    message: "Too many requests. Please try again later.",
};

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
    // Try to get IP from various headers (Vercel, Cloudflare, etc.)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    // Fallback to a default identifier
    return forwarded?.split(",")[0] || realIp || cfConnectingIp || "anonymous";
}

/**
 * Clean up expired entries (called periodically)
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
    request: NextRequest,
    config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
    const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };

    const clientId = getClientId(request);
    const key = `${request.nextUrl.pathname}:${clientId}`;
    const now = Date.now();

    // Cleanup old entries periodically (1% chance per request)
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    const existing = rateLimitStore.get(key);

    if (!existing || now > existing.resetTime) {
        // New window
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
    }

    if (existing.count >= maxRequests) {
        // Rate limited
        return { allowed: false, remaining: 0, resetTime: existing.resetTime };
    }

    // Increment counter
    existing.count++;
    return {
        allowed: true,
        remaining: maxRequests - existing.count,
        resetTime: existing.resetTime
    };
}

/**
 * Rate limiting middleware for API routes
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = withRateLimit(request, { maxRequests: 10 });
 *   if (rateLimitResult) return rateLimitResult;
 *   
 *   // ... handle request
 * }
 * ```
 */
export function withRateLimit(
    request: NextRequest,
    config: Partial<RateLimitConfig> = {}
): NextResponse | null {
    const { message } = { ...DEFAULT_CONFIG, ...config };
    const result = checkRateLimit(request, config);

    if (!result.allowed) {
        return NextResponse.json(
            {
                error: message,
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            },
            {
                status: 429,
                headers: {
                    "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
                    "X-RateLimit-Limit": String(config.maxRequests || DEFAULT_CONFIG.maxRequests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
                },
            }
        );
    }

    return null; // Request allowed
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 * 
 * @example
 * ```ts
 * export const POST = rateLimited(
 *   async (request: NextRequest) => {
 *     // ... handle request
 *   },
 *   { maxRequests: 10, windowMs: 60000 }
 * );
 * ```
 */
export function rateLimited<T extends (request: NextRequest) => Promise<NextResponse>>(
    handler: T,
    config: Partial<RateLimitConfig> = {}
): T {
    return (async (request: NextRequest) => {
        const rateLimitResponse = withRateLimit(request, config);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }
        return handler(request);
    }) as T;
}
