import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Start timer for JWT verification

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const authStart = performance.now();
  try {
    console.log({
      hasAccessToken: Boolean(req.cookies?.accessToken),
      hasRefreshToken: Boolean(req.cookies?.refreshToken),
      hasAuthorization: Boolean(req.header("Authorization")),
    });

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No accesss token recieved.");
      throw new ApiError(401, "Unauthorized request");
    }

    authStart = performance.now();

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log(
      "[PERF][verifyJWT]",
      `${(performance.now() - authStart).toFixed(2)}ms`
    );

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      //TODO : Disscuss about frontend
      console.log("User not found");
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access-token");
  }
});

// End timer for JWT verification
