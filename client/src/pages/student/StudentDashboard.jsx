import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";

import {
  fetchStudentDashboard,
  submitTask,
  fetchBadgesCertificates,
} from "../../routes/student";
import {
  fetchStudentNotifications,
  markNotificationRead,
} from "../../routes/notifications";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const StudentDashboard = () => {
  // Startups state for mentorship/networking
  const [startups, setStartups] = useState([]);
  const [startupsLoading, setStartupsLoading] = useState(true);
  useEffect(() => {
    const fetchStartups = async () => {
      setStartupsLoading(true);
      try {
        const res = await api.get("/startup/all");
        setStartups(res.data);
      } catch {
        setStartups([]);
      }
      setStartupsLoading(false);
    };
    fetchStartups();
  }, []);
  const { user, authData } = useAuth();
  const token = authData?.token;
  useEffect(() => {
    console.log("[DEBUG] StudentDashboard user:", user);
    console.log("[DEBUG] StudentDashboard user.id:", user?.id);
    console.log("[DEBUG] StudentDashboard token:", token);
    if (!token) {
      console.warn("[WARNING] No token found. API calls may fail.");
    }
  }, [user, token]);
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

  // Mark notification as read and remove from list
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(token, notif._id);
      setNotifications((prev) => prev.filter((n) => n._id !== notif._id));
    }
    if (notif.link) {
      window.location.href = notif.link;
    }
  };
  if (dashboardLoading || badgesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  // Get student, tasks, certificates, notifications from dashboard data
  const student = dashboard?.student || {};
  const tasks = dashboard?.tasks || [];
  const certificates = dashboard?.certificates || [];
  // const notifications = dashboard?.notifications || [];

  return (
    <div>
      {/* Notifications Section */}
      <div className="relative flex justify-end">
        <button
          title="Notifications"
          className="relative text-xl ml-4 me-3"
          onClick={() => setShowNotifications((prev) => !prev)}
          style={{ position: "static" }}
        >
          🔔
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 me-3">
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
            {notifications.filter((n) => !n.read).length === 0 ? (
              <div className="text-gray-500">No notifications.</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {notifications
                  .filter((notif) => !notif.read)
                  .map((notif, idx) => (
                    <li
                      key={notif._id || idx}
                      className="p-3 rounded shadow border bg-yellow-50"
                    >
                      <div className="font-medium">{notif.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </div>
                      {notif.link && (
                        <button
                          onClick={() => handleNotificationClick(notif)}
                          className="text-blue-600 underline text-sm"
                        >
                          View
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {/* Profile Summary & Progress Overview */}
      <section className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center md:col-span-1">
          <div className="w-20 h-20 rounded-full bg-primary-button flex items-center justify-center text-3xl text-white font-bold mb-3">
            {user?.firstName
              ? user.firstName.charAt(0).toUpperCase()
              : user?.email
              ? user.email.charAt(0).toUpperCase()
              : "U"}
          </div>
          <div className="text-lg font-semibold text-primary-dark mb-1">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-sm text-gray-500 mb-2">{user?.email}</div>
          {/* <div className="flex flex-wrap gap-2 justify-center">
            {user?.skills?.length > 0 ? (
              user.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                >
                  {typeof skill === "string" ? skill : skill.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400">No skills added</span>
            )}
          </div> */}
          <a
            href="/profile"
            className="flex items-center gap-2 hover:underline mt-3"
          >
            <span className="bg-primary-button rounded-full p-2">
              Edit Profile
            </span>
          </a>
        </div>
        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-center md:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-primary-dark">
                {tasks.length}
              </span>
              <span className="text-sm text-gray-500">Tasks Assigned</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-green-600">
                {tasks.filter((t) => t.status === "completed").length}
              </span>
              <span className="text-sm text-gray-500">Tasks Completed</span>
            </div>
            {/* <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-blue-600">
                {certificates.length}
              </span>
              <span className="text-sm text-gray-500">Certificates Earned</span>
            </div> */}
          </div>
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-primary-button h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    tasks.length
                      ? (tasks.filter((t) => t.status === "completed").length /
                          tasks.length) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {tasks.length
                ? `${Math.round(
                    (tasks.filter((t) => t.status === "completed").length /
                      tasks.length) *
                      100
                  )}%`
                : "0%"}{" "}
              completed
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto py-8 px-4">
        {/* Assigned Tasks */}

        <section className="mb-8 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Assigned Tasks
          </h2>
          {tasks.length === 0 ? (
            <div className="flex flex-row items-center gap-4 justify-center">
              <button
                className="btn btn-primary"
                onClick={() => (window.location.href = "/tasks")}
              >
                Go to Tasks
              </button>
            </div>
          ) : (
            <div className="w-full max-w-3xl space-y-4 flex flex-col items-center">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="p-4 bg-white rounded shadow border flex justify-between items-center w-full"
                >
                  <div>
                    <div className="font-semibold text-lg">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      Deadline:{" "}
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => (window.location.href = "/tasks")}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mentorship/Networking Opportunities Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Mentorship & Networking Opportunities
            </h2>
          </div>
          {startupsLoading ? (
            <div className="text-gray-500">Loading startups...</div>
          ) : startups.length === 0 ? (
            <div className="text-gray-400">No startups found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {startups.map((startup) => (
                <div
                  key={startup._id}
                  className="bg-white p-4 rounded-lg shadow border "
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {startup.companyName || startup.firstName || "Startup"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">{startup.email}</p>
                  <button
                    className="btn btn-primary btn-sm w-50"
                    onClick={() =>
                      (window.location.href = `/chat/${startup._id}`)
                    }
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-4">
            For more opportunities, check the community or contact your program
            coordinator.
          </div>
        </section>
      </main>
    </div>
  );
  // ...existing code...
};

export default StudentDashboard;
