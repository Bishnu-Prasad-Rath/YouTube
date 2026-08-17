import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

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

    const jwtStart = performance.now();

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const jwtTime = performance.now() - jwtStart;

    if (!decodedToken?._id) {
      throw new ApiError(401, "Invalid access token");
    }

    const authenticatedUser = {
      _id: decodedToken._id,
      email: decodedToken.email,
      username: decodedToken.username,
      fullName: decodedToken.fullName,
    };

    req.auth = authenticatedUser;
    req.user = authenticatedUser;

    const total = performance.now() - authStart;

    console.log("[PERF][verifyJWT]", {
      jwt: Number(jwtTime.toFixed(2)),
      total: Number(total.toFixed(2)),
      hasCookieToken: Boolean(cookieToken),
      hasAuthorization: Boolean(authorizationHeader),
    });

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
