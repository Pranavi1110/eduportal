import api from "../services/api";

export async function fetchStartupNotifications(token) {
  if (!token) return [];
  try {
    const res = await api.get("/startup/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.data) return [];
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.notifications)) return res.data.notifications;
    return [];
  } catch (error) {
    return [];
  }
}

export async function markStartupNotificationRead(token, notifId) {
  if (!token || !notifId) return;
  try {
    await api.patch(
      `/startup/notifications/${notifId}/read`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (err) {
    // handle error
  }
}
