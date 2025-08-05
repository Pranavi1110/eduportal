import api from "../services/api";

export async function fetchStudentNotifications(token) {
  console.log("[DEBUG] Sending token for notifications:", token);
  try {
    if (!token) {
      console.warn("No token provided for notifications fetch");
      return [];
    }
    const res = await api.get("/student/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("[DEBUG] Notifications API response:", res.data);
    if (!res.data) return [];
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.notifications)) return res.data.notifications;
    return [];
  } catch (error) {
    if (error.response) {
      console.error("Error fetching notifications:", error.response.data);
    } else {
      console.error("Error fetching notifications:", error);
    }
    return [];
  }
}
