import axios from "axios";

// Prefer environment variable if provided; fallback to deployed backend URL
const API_BASE = import.meta.env.VITE_API_BASE || "https://hubinity.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE,
  // Disable credentialed requests since we use Authorization header (Bearer token)
  withCredentials: false,
});

// Add Authorization header with JWT if available
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem("auth");
  if (auth) {
    const { token } = JSON.parse(auth);
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
