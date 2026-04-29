import { redisClient } from "../config/redis.config.js";

const rateLimiter = async ({ key, windowSize = 10, maxRequests = 10 }) => {
  const now = Date.now();
  const windowStart = now - windowSize * 1000;

  await redisClient.zremrangebyscore(key, 0, windowStart);

  const currentRequest = await redisClient.zcard(key);

  if (currentRequest >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: windowSize,
    };
  }

await redisClient.zadd(key, now, `${now}-${Math.random()}`);

  await redisClient.expire(key, windowSize);

  return {
    allowed: true,
    remaining: maxRequests - currentRequest - 1,
  };
};

export { rateLimiter };
