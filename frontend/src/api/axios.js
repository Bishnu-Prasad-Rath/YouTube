import axios from "axios";

export const api = axios.create({
  baseURL: "https://youtube-3agm.onrender.com/api/v1", // Adjust to match your backend port
  withCredentials: true, // Crucial for getting and setting HTTP-only cookies
});

// Optionally add an interceptor to handle token refreshes if needed later.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Basic error handling log
    console.error("API Error Response:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
