
import axios from "axios";
import { toast } from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      // Remove JSON Content-Type for multipart requests.
      // Axios/browser will automatically set the correct boundary.
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      if (typeof window !== "undefined") {
        toast.error("Session expired. Please login again.");

        // Prevent redirect loops
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    } else {
      toast.error(message || "Something went wrong!");
    }

    return Promise.reject(error);
  }
);

export default api;
