import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (error.response) {
      console.error("API Error:", {
        url: error.config?.url,
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error("API Error - No response:", {
        url: error.config?.url,
        message: "No response from server",
      });
    }
    return Promise.reject(error);
  }
);

export default api;
