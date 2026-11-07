
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

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 401) {
      // JWT expired or unauthorized
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
