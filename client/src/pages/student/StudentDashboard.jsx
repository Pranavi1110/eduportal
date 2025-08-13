import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
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
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Briefcase,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { fetchAllCertificates } from "../../routes/certificates";

const StudentDashboard = () => {
  const { user, authData } = useAuth();
  const navigate = useNavigate();

  // Startups state for mentorship/networking
  const [startups, setStartups] = useState([]);
  const [startupsLoading, setStartupsLoading] = useState(true);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [availableTasksLoading, setAvailableTasksLoading] = useState(true);

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

    const fetchAvailableTasks = async () => {
      setAvailableTasksLoading(true);
      try {
        const res = await api.get("/student/tasks/all");
        // Filter out tasks that are already assigned to this student
        const filteredTasks = res.data.filter(
          (task) =>
            task.status === "open" &&
            (!task.assignedStudent || task.assignedStudent._id !== user?.id)
        );
        setAvailableTasks(filteredTasks);
      } catch {
        setAvailableTasks([]);
      }
      setAvailableTasksLoading(false);
    };

    fetchStartups();
    if (user?.id) {
      fetchAvailableTasks();
    }
  }, [user?.id]);
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

  // Fetch all certificates directly from Certificate collection
  const {
    data: allCertificates = [],
    isLoading: certificatesLoading,
    refetch: refetchCertificates,
  } = useQuery(["all-certificates"], () => fetchAllCertificates(token), {
    enabled: !!token,
  });

  // Submission state
  const [submission, setSubmission] = useState({});
  const [submitting, setSubmitting] = useState({});

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

  // Handle task submission
  const handleSubmitTask = async (taskId, link) => {
    if (!link.trim()) return;

    setSubmitting((prev) => ({ ...prev, [taskId]: true }));
    try {
      await api.post(`/student/tasks/${taskId}/submit-link`, { link });
      toast.success("Task submitted successfully!");
      // Remove from available tasks
      setAvailableTasks((prev) => prev.filter((task) => task._id !== taskId));
      setSubmission((prev) => ({ ...prev, [taskId]: "" }));
      // Refetch dashboard and certificates to update certificates count
      if (typeof queryClient?.invalidateQueries === "function") {
        queryClient.invalidateQueries(["student-dashboard"]);
        refetchCertificates();
      }
    } catch (err) {
      toast.error("Failed to submit task");
    }
    setSubmitting((prev) => ({ ...prev, [taskId]: false }));
  };

  if (dashboardLoading || certificatesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  // Get student, tasks, certificates, notifications from dashboard data
  const student = dashboard?.student || {};
  const tasks = dashboard?.tasks || [];
  const certificates = allCertificates;

  const assignedTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "submitted":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "under-review":
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "under-review":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

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
      <section className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <a
            href="/profile"
            className="flex items-center gap-2 hover:underline mt-3"
          >
            <span className="bg-primary-button rounded-full p-2">
              Edit Profile
            </span>
          </a>
        </div>

        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-primary-dark">
              {assignedTasks.length}
            </span>
          </div>
          <span className="text-sm text-gray-500">Active Tasks</span>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-green-600">
              {completedTasks.length}
            </span>
          </div>
          <span className="text-sm text-gray-500">Completed Tasks</span>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">
              {certificates.length}
            </span>
          </div>
          <span className="text-sm text-gray-500">Certificates</span>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Assigned Tasks */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6" />
              My Assigned Tasks
            </h2>
            <button
              className="btn-primary"
              onClick={() => (window.location.href = "/tasks")}
            >
              View All Tasks
            </button>
          </div>

          {assignedTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow border">
              <div className="text-gray-500 text-lg mb-4">
                No active tasks assigned
              </div>
              <button
                className="btn-primary"
                onClick={() => (window.location.href = "/tasks")}
              >
                Browse Available Tasks
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white rounded-lg shadow border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          task.status
                        )}`}
                      >
                        {task.status.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {task.category}
                    </span>
                    {task.skills?.slice(0, 2).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </div>

                  <div className="text-xs text-gray-600 mb-4">
                    From:{" "}
                    <span className="font-semibold">
                      {task.startup?.companyName || "Unknown"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn-primary flex-1 text-sm"
                      onClick={() => (window.location.href = "/tasks")}
                    >
                      View Details
                    </button>
                    <button
                      className="btn-ghost p-2"
                      onClick={() => {
                        console.log(
                          "Chat button clicked for startup:",
                          task.startup?._id
                        );
                        navigate(`/chat/${task.startup?._id}`);
                      }}
                      title="Chat with startup"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Completed Tasks
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white rounded-lg shadow border p-6 border-green-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Completed
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="text-xs text-gray-500 mb-3">
                    Completed:{" "}
                    {task.completedAt
                      ? new Date(task.completedAt).toLocaleDateString()
                      : "N/A"}
                  </div>

                  <div className="text-xs text-gray-600 mb-4">
                    From:{" "}
                    <span className="font-semibold">
                      {task.startup?.companyName || "Unknown"}
                    </span>
                  </div>

                  <button
                    className="btn-secondary w-full text-sm"
                    onClick={() => (window.location.href = "/certificates")}
                  >
                    View Certificate
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Available Tasks from Other Startups */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6" />
              Available Tasks from Other Startups
            </h2>
          </div>

          {availableTasksLoading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow border">
              <div className="text-gray-500">Loading available tasks...</div>
            </div>
          ) : availableTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow border">
              <div className="text-gray-500 text-lg">
                No available tasks at the moment
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableTasks.slice(0, 6).map((task) => (
                <div
                  key={task._id}
                  className="bg-white rounded-lg shadow border p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {task.category}
                    </span>
                    {task.skills?.slice(0, 2).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </div>

                  <div className="text-xs text-gray-600 mb-4">
                    From:{" "}
                    <span className="font-semibold">
                      {task.startup?.companyName || "Unknown"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="Submit your work link"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={submission[task._id] || ""}
                      onChange={(e) =>
                        setSubmission((prev) => ({
                          ...prev,
                          [task._id]: e.target.value,
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn-primary flex-1 text-sm"
                        onClick={() =>
                          handleSubmitTask(task._id, submission[task._id])
                        }
                        disabled={
                          submitting[task._id] || !submission[task._id]?.trim()
                        }
                      >
                        {submitting[task._id] ? "Submitting..." : "Submit Task"}
                      </button>
                      <button
                        className="btn-ghost p-2"
                        onClick={() => {
                          console.log(
                            "Chat button clicked for startup:",
                            task.startup?._id
                          );
                          navigate(`/chat/${task.startup?._id}`);
                        }}
                        title="Chat with startup"
                      >
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableTasks.length > 6 && (
            <div className="text-center mt-6">
              <button
                className="btn-secondary"
                onClick={() => (window.location.href = "/tasks")}
              >
                View All Available Tasks
              </button>
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
              {startups.slice(0, 6).map((startup) => (
                <div
                  key={startup._id}
                  className="bg-white p-4 rounded-lg shadow border"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {startup.companyName || startup.firstName || "Startup"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">{startup.email}</p>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary btn-sm flex-1"
                      onClick={() => {
                        console.log(
                          "Connect button clicked for startup:",
                          startup._id
                        );
                        navigate(`/chat/${startup._id}`);
                      }}
                    >
                      Connect
                    </button>
                  </div>
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
};

export default StudentDashboard;
