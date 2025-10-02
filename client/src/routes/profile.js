// Student profile API for fetching and updating profile, badges, certificates
const API_BASE = `${(import.meta.env.VITE_API_BASE || "https://hubinity.onrender.com/api")}/student`;

// Fetch student profile by userId (no auth required)
export async function fetchStudentProfile(token) {
  const res = await fetch(`${API_BASE}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

// Update student profile by userId (no auth required)
export async function updateStudentProfile(userId, data) {
  const auth = localStorage.getItem("auth");
  const token = auth ? JSON.parse(auth).token : null;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ ...data, userId }),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to update profile");
  return result;
}

export async function createStudentProfile(data) {
  const auth = localStorage.getItem("auth");
  const token = auth ? JSON.parse(auth).token : null;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/profile`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Failed to create profile");
  return result;
}
