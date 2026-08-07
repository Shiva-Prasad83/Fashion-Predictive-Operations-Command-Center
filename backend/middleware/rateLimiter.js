/**
 * In-memory rate limiter — serverless-safe version.
 * No setInterval (crashes Vercel). Each limiter has an isolated Map.
 * Stale entries are pruned lazily on each request.
 */
const createRateLimiter = (windowMs, max, message) => {
  const counts = new Map();

  const pruneStale = () => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of counts.entries()) {
      const valid = timestamps.filter(ts => ts > cutoff);
      if (valid.length === 0) counts.delete(key);
      else counts.set(key, valid);
    }
  };

  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Lazy prune every ~100 requests to avoid memory growth
    if (Math.random() < 0.01) pruneStale();

    const prev = (counts.get(key) || []).filter(ts => ts > windowStart);
    prev.push(now);
    counts.set(key, prev);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - prev.length));

    if (prev.length > max) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
};

// General API limiter — 500 req / 15 min
const generalLimiter = createRateLimiter(
  900000, 500,
  'Too many requests. Please try again in 15 minutes.'
);

// Auth limiter — 50 attempts / 15 min
const authLimiter = createRateLimiter(
  900000, 50,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// AI limiter — kept for export, not applied to routes
const aiLimiter = createRateLimiter(60000, 100, 'Too many AI requests.');

module.exports = { generalLimiter, authLimiter, aiLimiter };
