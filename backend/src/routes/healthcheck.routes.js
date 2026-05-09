import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async (req, res) => {
    // 1. Extract the secret key from the request headers
    // Note: Express automatically converts header keys to lowercase
    const secretKey = req.headers['x-health-key'];

    // 2. Check if the key matches your environment variable
    if (!secretKey || secretKey !== process.env.HEALTH_CHECK_SECRET) {
        // Drop the request immediately if the key is missing or wrong
        throw new ApiError(403, "Unauthorized: Invalid Health Check Key");
    }

    // 3. If the key is correct, send the standard success response
    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { status : "OK" },
            "Server is healthy and secure 🚀"
        )
    )
})

export {
    healthcheck
}