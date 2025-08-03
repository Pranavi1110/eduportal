// Student profile API for fetching and updating profile, badges, certificates
const API_BASE = "http://localhost:5000/api/student";

// Fetch student profile by userId (no auth required)
export async function fetchStudentProfile(userId) {
  const res = await fetch(`${API_BASE}/dashboard?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

// Update student profile by userId (no auth required)
export async function updateStudentProfile(userId, data) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...data, userId }),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function createStudentProfile(data) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create profile");
  return res.json();
}
