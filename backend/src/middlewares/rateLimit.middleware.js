import { rateLimiter } from "../redis/rateLimiter.js";

const rateLimitMiddleware = (options) => {
  return async (req, res, next) => {

const loadTestSecret = process.env.LOAD_TEST_SECRET;

if (
  loadTestSecret &&
  req.headers["x-load-test-key"] === loadTestSecret
) {
  return next();
}

    const identifier = req.user?._id || req.ip;
    const key = `rate:${identifier}:${req.path}`;

const rateLimitStart = performance.now();

const result = await rateLimiter({
  key,
  ...options,
});

const rateLimitTime = performance.now() - rateLimitStart;

console.log(
  `[PERF][rateLimit] ${rateLimitTime.toFixed(2)}ms`
);

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        message: "Too many requests, try again later.",
      });
    }

    next();
  };
};

export { rateLimitMiddleware };