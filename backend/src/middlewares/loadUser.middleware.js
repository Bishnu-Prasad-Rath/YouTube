import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const loadUser = asyncHandler(async (req, _, next) => {
  const start = performance.now();

  if (!req.auth?._id) {
    throw new ApiError(401, "Authentication context missing");
  }

  const user = await User.findById(req.auth._id)
    .select("-password -refreshToken")
    .lean();

  const dbTime = performance.now() - start;

  console.log("[PERF][loadUser]", {
    userLookup: Number(dbTime.toFixed(2)),
  });

  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  req.user = user;

  next();
});