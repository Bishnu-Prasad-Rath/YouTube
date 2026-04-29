import { redisClient } from "../config/redis.config.js";

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ Connected:", socket.id);

    // 🎥 Video Room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("joinChannel", (channelId) => {
      socket.join(`channel:${channelId}`);
      console.log(`User joined channel room: ${channelId}`);
    });

    socket.on("leaveChannel", (channelId) => {
      socket.leave(`channel:${channelId}`);
    });

    // 💬 Comment Room
    socket.on("join:comment", (commentId) => {
      socket.join(`comment:${commentId}`);
      console.log(`User joined comment room: ${commentId}`);
    });

    socket.on("leave:comment", (commentId) => {
      socket.leave(`comment:${commentId}`);
    });

    // 🐦 Tweet Room
    socket.on("join:tweet", (tweetId) => {
      socket.join(`tweet:${tweetId}`);
      console.log(`User joined tweet room: ${tweetId}`);
    });

    socket.on("leave:tweet", (tweetId) => {
      socket.leave(`tweet:${tweetId}`);
    });

    socket.on("join-live", async (liveId) => {
      try {
        socket.join(`live:${liveId}`);

        //  store liveId in socket (important)
        socket.liveId = liveId;
        //  increment viewers
        const viewers = await redisClient.incr(`live:${liveId}:viewers`);
        //  broadcast updated count
        io.to(`live:${liveId}`).emit("live:viewers", viewers);

        console.log(`👀 Viewer joined live ${liveId}: ${viewers}`);
      } catch (error) {
        console.log("Socket join error : ", error.message);
      }
    });

    socket.on("chat-message", async ({ liveId, message }) => {
      try {
        if (!liveId || !message) return;

        const key = `chat:${socket.id}`;
        const count = await redisClient.incr(key);

        if (count === 1) {
          await redisClient.expire(key, 10);
        }

        if (count > 10) return;

        io.to(`live:${liveId}`).emit("new-message", {
          message,
          user: socket.user,
          createdAt: new Date(),
        });
      } catch (error) {
        console.log("Socket message error:", error.message);
      }
    });

    socket.on("disconnect", async () => {
      try {
        console.log("❌ Disconnected:", socket.id);

        if (socket.liveId) {
          const key = `live:${socket.liveId}:viewers`;

          let viewers = await redisClient.decr(key);

          // ✅ prevent negative
          if (viewers < 0) {
            viewers = 0;
            await redisClient.set(key, 0);
          }

          io.to(`live:${socket.liveId}`).emit("live:viewers", viewers);

          console.log(`❌ Viewer left live ${socket.liveId}: ${viewers}`);
        }
      } catch (error) {
        console.log("Socket disconnect error : ", error.message);
      }
    });
  });
};

export { initSocket };
