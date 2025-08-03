import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
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
