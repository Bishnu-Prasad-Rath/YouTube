import IORedis from "ioredis";

const redisClient = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const testRedisLatency = async () => {
  for (let i = 1; i <= 5; i++) {
    const start = performance.now();

    await redisClient.ping();

    const latency = performance.now() - start;

    console.log(
      `[PERF][Redis PING ${i}] ${latency.toFixed(2)}ms`
    );
  }
};

redisClient.on("connect", () => {
  console.log("Redis is connecting...");
});

redisClient.on("ready", async () => {
  console.log("✅ Redis is Ready.");

  await testRedisLatency();
});

redisClient.on("error", (err) => {
  console.log("❌ Redis Error:", err);
});

const connectRedis = async () => {
  console.log("✅ Redis initialization complete");
};

export {
  redisClient,
  connectRedis,
  testRedisLatency,
};