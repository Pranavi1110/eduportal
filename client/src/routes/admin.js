import api from "../services/api";

export const fetchAdminStudentDashboard = (studentId) =>
  api.get(`/admin/dashboard/student/${studentId}`).then((r) => r.data);

export const fetchAdminStartupDashboard = (startupId) =>
  api.get(`/admin/dashboard/startup/${startupId}`).then((r) => r.data);
