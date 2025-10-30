import axios from "axios";

// Create an axios instance for all API requests
const api = axios.create({
  baseURL: "/api", // Vite proxy will redirect this to http://localhost:5000
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: attach token from localStorage (for auth)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
