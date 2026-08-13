import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import  helmet  from "helmet";
import { errorHandler } from "./middlewares/error.middleware.js";


const app = express();

app.use((req, res, next) => {
  const start = performance.now();

  res.on("finish", () => {
    console.log("[PERF][REQUEST]", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      total: Number((performance.now() - start).toFixed(2)),
    });
  });

  next();
});

app.use(helmet());
app.disable("x-powered-by");

app.use(cors({
  origin: process.env.CORS_ORIGIN, // Adjust to match your frontend URL
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
}));

import healthCheckRouter from "./routes/healthcheck.routes.js";
import { healthcheckLimiter } from "./middlewares/healthcheckRateLimit.middleware.js";

app.use("/api/v1/healthCheck", healthCheckRouter);  //I will trigger teh cold start from render.

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());

//Routes

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import liveRouter from "./routes/live.routes.js";

//Routes delcaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/live", liveRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(errorHandler);

export { app };




