import IORedis from "ioredis";

const redisClient = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

redisClient.on("connect", () => {
  console.log("Redis is connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis is Ready.");
});

redisClient.on("error", (err) => {
  console.log("❌ Redis Error:", err);
});

const connectRedis = async () => {
  try {
    // ioredis auto-connects, no need for .connect()
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.log("❌ Redis connection failed:", error);
  }
};

export { redisClient, connectRedis };