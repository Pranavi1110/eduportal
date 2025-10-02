// Fetch login details for the current student from users collection
const API_BASE = `${(import.meta.env.VITE_API_BASE || "https://hubinity.onrender.com/api")}/student`;

export async function fetchLoginDetails(token) {
  const res = await fetch(`${API_BASE}/login-details`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch login details");
  return res.json();
}
