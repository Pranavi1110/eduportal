// Help Center API function
const API_BASE = "http://localhost:5000/api";

export async function submitHelpRequest(data) {
  const res = await fetch(`${API_BASE}/help`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit help request");
  return res.json();
}
