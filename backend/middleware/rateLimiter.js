/**
 * In-memory rate limiter with per-limiter isolated counters.
 * Each limiter instance maintains its own Map so different routes
 * do not share the same request count bucket.
 */
const createRateLimiter = (windowMs, max, message) => {
  // Each limiter has its own isolated counter map
  const counts = new Map();

  // Periodic cleanup
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of counts.entries()) {
      const valid = timestamps.filter(ts => ts > cutoff);
      if (valid.length === 0) counts.delete(key);
      else counts.set(key, valid);
    }
  }, Math.min(windowMs, 60000));

  return (req, res, next) => {
    const key = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    const prev = (counts.get(key) || []).filter(ts => ts > windowStart);
    prev.push(now);
    counts.set(key, prev);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - prev.length));
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    if (prev.length > max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    next();
  };
};

// General API limiter — 500 requests per 15 min per IP
const generalLimiter = createRateLimiter(
  900000,
  500,
  'Too many requests from this IP. Please try again in 15 minutes.'
);

// Auth limiter — 50 attempts per 15 min (plenty for dev/testing)
const authLimiter = createRateLimiter(
  900000,
  50,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// AI limiter — kept for export but no longer applied to routes
// (removed from aiRoutes.js to avoid blocking during development)
const aiLimiter = createRateLimiter(
  60000,
  100,
  'Too many AI requests. Please wait before making another request.'
);

module.exports = { generalLimiter, authLimiter, aiLimiter };
