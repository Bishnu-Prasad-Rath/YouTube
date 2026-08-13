import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const authStart = performance.now();

  try {
    const cookieToken = req.cookies?.accessToken;

    const authorizationHeader = req.header("Authorization");

    const headerToken = authorizationHeader?.startsWith("Bearer ")
      ? authorizationHeader.slice(7)
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    //Verify JWT token

    const jwtStart = performance.now();

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const jwtTime = performance.now() - jwtStart;

    if (!decodedToken?._id) {
      throw new ApiError(401, "Invalid access token");
    }

    //Cheap auth context

    req.auth = {
      _id: decodedToken._id,
      email: decodedToken.email,
      username: decodedToken.username,
      fullName: decodedToken.fullName,
    };

    console.log("[PERF][verifyJWT]", {
      jwt: Number(jwtTime.toFixed(2)),
      total: Number(
        (performance.now() - authStart).toFixed(2)
      ),
      hasCookieToken: Boolean(cookieToken),
      hasAuthorization: Boolean(authorizationHeader),
    });

    //Temporay phase

    const user = await User.findById(decodedToken._id)
      .select("-password -refreshToken")
      .lean();

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid access token"
    );
  }
});