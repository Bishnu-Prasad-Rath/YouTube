import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { connectRedis } from "./config/redis.config.js";
import http from "http";
import { Server } from "socket.io";
import { initSocket } from "./socket/socket.js";
import { setIO } from "./socket/socketInstance.js";

dotenv.config({
  path: "./.env",
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"]
  },
});

initSocket(io);
setIO(io);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.on("ERROR", (error) => {
      console.log(`There is something server error ${error}`);
      throw error;
    });

    server.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running with WebSocket`);
    });
  } catch (error) {
    console.log("Server start FAILED:", error);
  }
};

startServer();

// import express from "express";
// const app = express();
// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("There is something wrong with the server",error);
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port,${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error("ERROR",error)
//         throw error
//     }
// })()
