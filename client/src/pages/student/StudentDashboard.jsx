import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";

import {
  fetchStudentDashboard,
  submitTask,
  fetchBadgesCertificates,
} from "../../routes/student";
import { fetchStudentNotifications } from "../../routes/notifications";
import { useAuth } from "../../hooks/useAuth";

const StudentDashboard = () => {
  const { user, authData } = useAuth();
  const token = authData?.token;
  const queryClient = useQueryClient();

  // Fetch student dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery(
    ["student-dashboard"],
    () => fetchStudentDashboard(token),
    {
      enabled: !!token,
      onSuccess: (data) => {
        console.log("[DEBUG] StudentDashboard dashboard:", data);
      },
    }
  );

  // Fetch badges and certificates
  const { data: badgesCerts, isLoading: badgesLoading } = useQuery(
    ["badges-certificates"],
    () => fetchBadgesCertificates(token),
    { enabled: !!token }
  );

  // Submission state
  const [submission, setSubmission] = useState({});
  const submitTaskMutation = useMutation(
    ({ taskId, data }) => submitTask(token, taskId, data),
    {
      onSuccess: () => {
        toast.success("Task submitted!");
        queryClient.invalidateQueries(["student-dashboard"]);
      },
      onError: (err) => toast.error(err.message || "Submission failed"),
    }
  );

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const notifRes = await fetchStudentNotifications(token);
        setNotifications(notifRes);
        console.log("[DEBUG] Notifications fetched:", notifRes);
      } catch (e) {
        console.error("Error fetching notifications:", e);
      }
    };
    fetchNotifications();
  }, [token]);

  if (dashboardLoading || badgesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const student = dashboard?.user || {};
  const tasks = dashboard?.tasks || [];
  const badges = badgesCerts?.badges || [];
  const certificates = badgesCerts?.certificates || [];

  const handleInput = (taskId, field, value) => {
    setSubmission((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value },
    }));
  };

  const handleSubmit = (e, taskId) => {
    e.preventDefault();
    submitTaskMutation.mutate({ taskId, data: submission[taskId] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Student Dashboard</title>
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-primary-dark">
          Student Dashboard
        </h1>
        <div className="flex items-center gap-6">
          <button title="Chat with Startups" className="relative text-xl">
            💬
          </button>
          <div className="relative">
            <button
              title="Notifications"
              className="relative text-xl"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              🔔
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-10 right-0 bg-white border rounded shadow-lg w-80 z-50 p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Notifications</h3>
                  <button
                    className="text-gray-500 hover:text-gray-800 text-xl font-bold px-2"
                    onClick={() => setShowNotifications(false)}
                    title="Close"
                  >
                    &times;
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="text-gray-500">No notifications.</div>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((notif, idx) => (
                      <li
                        key={notif._id || idx}
                        className={`p-3 rounded shadow border ${
                          notif.read ? "bg-gray-100" : "bg-yellow-50"
                        }`}
                      >
                        <div className="font-medium">{notif.message}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(notif.createdAt).toLocaleString()}
                        </div>
                        {notif.link && (
                          <a
                            href={notif.link}
                            className="text-blue-600 underline text-sm"
                          >
                            View
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <a
            href="/profile"
            className="flex items-center gap-2 hover:underline"
          >
            👤 <span>Edit Profile</span>
          </a>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto py-8 px-4">
        {/* Assigned Tasks */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Assigned Tasks</h2>
          {tasks.length === 0 ? (
            <div className="text-gray-500">No tasks assigned yet.</div>
          ) : (
            <div className="w-full max-w-3xl space-y-4">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 bg-white rounded shadow border"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-lg">{task.title}</div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {task.status}
                    </span>
                  </div>
                  <div className="text-gray-600 mb-1">{task.description}</div>
                  <div className="text-sm text-gray-500 mb-1">
                    Category: {task.category}
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    Skills: {task.skills?.join(", ")}
                  </div>
                  <div className="text-sm text-gray-500">
                    Deadline:{" "}
                    {task.deadline
                      ? new Date(task.deadline).toLocaleDateString()
                      : "N/A"}
                  </div>
                  {task.assignedStudent && (
                    <div className="text-sm text-blue-600 mt-1">
                      Assigned to: {task.assignedStudent.firstName}{" "}
                      {task.assignedStudent.lastName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certificates Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Certificates</h2>
          {certificates.length === 0 && <p>No certificates available yet.</p>}
          <ul className="list-disc pl-5">
            {certificates.map((cert) => (
              <li key={cert._id}>
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {cert.taskTitle} – Download Certificate
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Profile Quick Access */}
        <section>
          <a href="/profile" className="btn btn-outline">
            Edit Full Profile
          </a>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
