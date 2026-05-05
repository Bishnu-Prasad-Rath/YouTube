import IORedis from "ioredis";

// Add the options object with maxRetriesPerRequest: null
const redisClient = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

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
    console.log("✅ Redis initialization complete");
  } catch (error) {
    console.log("❌ Redis initialization failed:", error);
  }
};

export { redisClient, connectRedis };