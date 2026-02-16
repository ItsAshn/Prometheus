/**
 * Simple in-memory rate limiter for self-hosted enthusiast platforms
 * Tracks requests by IP address and enforces configurable limits
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in the window
  message?: string; // Custom error message
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request from the given IP should be allowed
   * @param ip - Client IP address
   * @returns true if request is allowed, false if rate limit exceeded
   */
  check(ip: string): boolean {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetTime) {
      // First request or window expired - allow and create new entry
      this.store.set(ip, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment count and allow
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for an IP
   */
  getRemaining(ip: string): number {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get reset time for an IP (in seconds)
   */
  getResetTime(ip: string): number {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now > entry.resetTime) {
      return 0;
    }

    return Math.ceil((entry.resetTime - now) / 1000);
  }

  /**
   * Manually reset rate limit for an IP (useful for testing)
   */
  reset(ip: string): void {
    this.store.delete(ip);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(ip);
      }
    }
  }

  /**
   * Stop the cleanup interval (useful for testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current store size (for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Login attempts: 5 per 15 minutes
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: "Too many login attempts. Please try again in 15 minutes.",
  }),

  // Video uploads: 10 per hour
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: "Upload limit reached. Please try again in an hour.",
  }),

  // General API calls: 100 per minute
  api: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: "Too many requests. Please slow down.",
  }),

  // Video chunk uploads: Higher limit for chunked uploads
  uploadChunk: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 200, // Allow ~200 chunks per minute (reasonable for large uploads)
    message: "Upload rate limit exceeded. Please try again shortly.",
  }),
};

/**
 * Helper function to get client IP from request
 */
export function getClientIP(
  headers: Headers | Record<string, any>
): string {
  // Get headers as a Record for easier access
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) || undefined;
    }
    return headers[name];
  };

  // Try common proxy headers first
  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const firstIP = forwarded.split(",")[0];
    return firstIP ? firstIP.trim() : "unknown";
  }

  const realIP = getHeader("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = getHeader("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback to a safe default
  return "unknown";
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  limiter: RateLimiter,
  ip: string
): Record<string, string> {
  return {
    "X-RateLimit-Limit": limiter["config"].maxRequests.toString(),
    "X-RateLimit-Remaining": limiter.getRemaining(ip).toString(),
    "X-RateLimit-Reset": limiter.getResetTime(ip).toString(),
  };
}

export { RateLimiter };
export type { RateLimitConfig };
