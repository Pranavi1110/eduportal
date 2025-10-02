// Student API functions for dashboard, tasks, profile, badges/certificates
const API_BASE = `${(import.meta.env.VITE_API_BASE || "https://hubinity.onrender.com/api")}/student`;

export async function fetchStudentDashboard(token) {
  const res = await fetch(`${API_BASE}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function submitTask(token, taskId, data) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit task");
  return res.json();
}

export async function fetchBadgesCertificates(token) {
  const res = await fetch(`${API_BASE}/badges-certificates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch badges/certificates");
  return res.json();
}
