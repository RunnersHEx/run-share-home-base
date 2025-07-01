
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute
  booking: { windowMs: 60000, maxRequests: 5 }, // 5 requests per minute
  message: { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
  search: { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
};

export const checkRateLimit = async (
  identifier: string,
  type: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; resetTime: number }> => {
  const config = RATE_LIMITS[type];
  const key = `ratelimit:${type}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // In production, this would use Redis or similar
  // For now, we'll implement basic in-memory rate limiting
  const requests = await getRequestCount(key, windowStart);
  
  if (requests >= config.maxRequests) {
    return {
      allowed: false,
      resetTime: windowStart + config.windowMs
    };
  }
  
  await recordRequest(key, now);
  return { allowed: true, resetTime: 0 };
};

// Mock implementations - in production use Redis
async function getRequestCount(key: string, windowStart: number): Promise<number> {
  // Implementation would depend on your storage solution
  return 0;
}

async function recordRequest(key: string, timestamp: number): Promise<void> {
  // Implementation would depend on your storage solution
}

export { RATE_LIMITS };
