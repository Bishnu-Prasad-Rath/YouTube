import rateLimit from 'express-rate-limit';

// Lightweight, in-memory rate limiter specifically for the fast-lane health check
// Does NOT rely on Redis to ensure zero-latency cold starts.
export const healthcheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 50, // Limit each IP to 50 requests per minute
  message: {
      status: 429,
      message: "Too many health check requests from this IP, please try again after a minute."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});