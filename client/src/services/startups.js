import api from "../services/api";

// Fetch all startups (for chat)
export async function fetchAllStartups() {
  const res = await api.get("/users", { params: { role: "startup" } });
  return res.data;
}
