import {redisClient} from '../config/redis.config.js';

const rateLimitScript = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowStart = tonumber(ARGV[2])
local maxRequests = tonumber(ARGV[3])
local windowSize = tonumber(ARGV[4])
local requestId = tonumber(ARGV[5])

redis.call("ZREMRANGEBYSCORE", key, 0, windowStart)

local currentRequests = redis.call("ZCARD", key)

if currentRequests >= maxRequests then 
      return {0, currentRequests}
      end

redis.call("ZADD", key, now, requestId);
redis.call("EXPIRE", key, windowSize);

return {1, currentRequests + 1}
`

export const rateLimiter = async({
  key,
  maxRequests,
  windowSize,
}) => {
  const now = Date.now();
  const windowStart = now - windowSize * 1000;
  const requestId = `${now} - ${Math.random()}`;

  const result = await redisClient.eval(
    rateLimitScript,
    1,
    key,
    now,
    windowStart,
    maxRequests,
    windowSize,
    requestId,
  )

  const [allowed, currentRequests] = result;

  if(!allowed){
    return{
      allowed : false,
      remaining : 0,
      retryAfter : windowSize,
    }
  }

  return{
    allowed : true,
    remaining : Math.max(
      0,
      maxRequests - currentRequests
    ),
    retryAfter : 0,
  }
}