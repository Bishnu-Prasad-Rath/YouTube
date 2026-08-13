import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const authStart = performance.now();

  try {
    const hasCookieToken = Boolean(req.cookies?.accessToken);
    const hasAuthorization = Boolean(req.header("Authorization"));

    const token =
      req.header("Authorization")?.replace(/^Bearer\s+/i, "") ||
      req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // JWT verification
    const jwtStart = performance.now();

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const jwtTime = performance.now() - jwtStart;

    // Database user lookup
    const dbStart = performance.now();

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    const dbTime = performance.now() - dbStart;

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;

    const totalTime = performance.now() - authStart;

    console.log("[PERF][verifyJWT]", {
      jwt: Number(jwtTime.toFixed(2)),
      userLookup: Number(dbTime.toFixed(2)),
      total: Number(totalTime.toFixed(2)),
      hasCookieToken,
      hasAuthorization,
    });

    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid access-token"
    );
  }
});