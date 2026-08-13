import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const authStart = performance.now();

  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const jwtStart = performance.now();

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    const jwtTime = performance.now() - jwtStart;

    // No MongoDB lookup here.
    // The signed JWT already contains the required user information.
    req.user = decodedToken;

    console.log("[PERF][verifyJWT]", {
      jwt: Number(jwtTime.toFixed(2)),
      total: Number((performance.now() - authStart).toFixed(2)),
      hasCookieToken: Boolean(req.cookies?.accessToken),
      hasAuthorization: Boolean(req.header("Authorization")),
    });

    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid access token"
    );
  }
});