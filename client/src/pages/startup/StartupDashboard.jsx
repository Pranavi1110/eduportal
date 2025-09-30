import React, { useEffect, useState } from "react";
import {
  fetchStartupNotifications,
  markStartupNotificationRead,
} from "../../routes/startupNotifications";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Building, Users, Briefcase, Plus, Eye } from "lucide-react";

const StartupDashboard = ({
  viewStartupId = null,
  viewStartupData = null,
  isAdminView = false,
}) => {
  const { user, authData } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  // Fetch all submissions for this startup's tasks
  const fetchAllSubmissions = async () => {
    try {
      // Use /startup/tasks instead of /startup/dashboard to get properly populated submissions
      const res = await api.get("/startup/tasks");
      // Flatten all submissions from all tasks
      const allSubs = (res.data || []).flatMap((task) =>
        (task.submissions || []).map((sub) => ({
          ...sub,
          taskTitle: task.title,
          taskId: task._id,
          taskStatus: task.status,
          student: sub.student,
        }))
      );
      setSubmissions(allSubs);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    }
  };

  // Approve or reject a submission
  const handleSubmissionAction = async (taskId, studentId, approve) => {
    try {
      await api.post(`/startup/tasks/${taskId}/approve`, {
        studentId,
        approve,
      });
      fetchAllSubmissions();
    } catch (err) {
      alert("Failed to update submission status");
    }
  };

  useEffect(() => {
    if (viewStartupId) {
      // admin is viewing a specific startup; fetch profile and tasks
      const fetchImpersonated = async () => {
        setLoading(true);
        try {
          if (isAdminView) {
            const module = await import("../../routes/admin");
            const data = await module.fetchAdminStartupDashboard(viewStartupId);
            setProfile(data.startup);
            setTasks(data.tasks || []);
          } else {
            const prof =
              viewStartupData ||
              (await api.get(`/users/${viewStartupId}`).then((r) => r.data));
            setProfile(prof);
            // fetch tasks and filter those belonging to this startup
            const res = await api.get("/startup/tasks");
            const allTasks = res.data || [];
            const filtered = allTasks.filter((t) => {
              if (!t.startup) return false;
              return (
                (typeof t.startup === "object" && t.startup._id === prof._id) ||
                t.startup === prof._id
              );
            });
            setTasks(filtered);
          }
        } catch (err) {
          console.error("Error fetching impersonated startup dashboard", err);
          setProfile(viewStartupData || null);
          setTasks([]);
        }
        setLoading(false);
      };
      fetchImpersonated();
    } else {
      fetchDashboard();
    }
    // Fetch notifications for startup
    const fetchNotifications = async () => {
      const token = authData?.token;
      if (!token) return;
      const notifRes = await fetchStartupNotifications(token);
      setNotifications(notifRes);
    };
    fetchNotifications();
    fetchAllSubmissions();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/startup/dashboard");
      setProfile(res.data.startup);
      setTasks(res.data.tasks);
    } catch {
      setProfile(null);
      setTasks([]);
    }
    setLoading(false);
  };

  const stats = [
    {
      label: "Active Tasks",
      value: (tasks || []).filter(
        (t) => t.status === "open" || t.status === "in-progress"
      ).length,
      icon: Briefcase,
      color: "text-primary-button",
    },
    {
      label: "Students Hired",
      value: (tasks || []).filter((t) => t.assignedStudent).length,
      icon: Users,
      color: "text-primary-button",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-button border-t-transparent shadow-soft" />
      </div>
    );

  // prefer impersonated data when admin viewing a startup
  const displayStartup = viewStartupId
    ? profile || viewStartupData || {}
    : profile || user || {};

  return (
    <>
      <Helmet>
        <title>Startup Dashboard - Hubinity</title>
        <meta
          name="description"
          content="Startup dashboard for Hubinity platform"
        />
      </Helmet>

      <div className="min-h-screen bg-primary-white">
        {/* Header */}
        <div className="gradient-bg-elegant text-primary-cta">
          <div className="container-responsive py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-garamond font-bold">
                  Welcome back,{" "}
                  {displayStartup?.firstName ||
                    displayStartup?.companyName ||
                    user?.firstName}
                  !
                </h1>
                <p className="text-base md:text-lg text-gray-200 mt-1">
                  Here's what's happening with this startup
                </p>
              </div>
              <div className="flex space-x-3 items-center">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    title="Notifications"
                    className="relative p-3 rounded-full bg-primary-card text-primary-dark shadow-soft hover:shadow-medium"
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
                    <div className="absolute top-12 right-0 bg-primary-white border rounded-xl shadow-elegant w-80 z-50 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-primary-dark">
                          Notifications
                        </h3>
                        <button
                          className="text-gray-500 hover:text-primary-dark text-xl font-bold px-2"
                          onClick={() => setShowNotifications(false)}
                          title="Close"
                        >
                          &times;
                        </button>
                      </div>
                      {notifications.filter((n) => !n.read).length === 0 ? (
                        <div className="text-gray-600">No notifications.</div>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {notifications
                            .filter((notif) => !notif.read)
                            .map((notif, idx) => (
                              <li
                                key={notif._id || idx}
                                className="p-3 rounded-lg border bg-yellow-50 flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-medium text-primary-dark">
                                    {notif.message}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {new Date(notif.createdAt).toLocaleString()}
                                  </div>
                                  {notif.link && (
                                    <button
                                      onClick={async () => {
                                        if (!notif.read) {
                                          await markStartupNotificationRead(
                                            authData?.token,
                                            notif._id
                                          );
                                          setNotifications((prev) =>
                                            prev.filter(
                                              (n) => n._id !== notif._id
                                            )
                                          );
                                        }
                                        window.location.href = notif.link;
                                      }}
                                      className="text-primary-button hover:text-primary-dark text-sm"
                                    >
                                      View
                                    </button>
                                  )}
                                </div>
                                <button
                                  className="text-gray-400 hover:text-red-600 text-lg font-bold ml-2"
                                  title="Remove notification"
                                  onClick={async () => {
                                    await markStartupNotificationRead(
                                      authData?.token,
                                      notif._id
                                    );
                                    setNotifications((prev) =>
                                      prev.filter((n) => n._id !== notif._id)
                                    );
                                  }}
                                >
                                  &times;
                                </button>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {/* ...existing buttons... */}
                {!isAdminView && (
                  <button
                    className="btn-primary"
                    onClick={() => navigate("/startup/browse-students")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Browse Students
                  </button>
                )}
                {!isAdminView && (
                  <button
                    className="btn-primary"
                    onClick={() => navigate("/startup/post-work")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Work
                  </button>
                )}
                {viewStartupId && (
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      const id =
                        displayStartup._id ||
                        displayStartup.id ||
                        displayStartup.email;
                      if (isAdminView) {
                        navigate(`/admin/startups/${id}/profile`);
                        return;
                      }
                      navigate(`/startup/${id}`);
                    }}
                  >
                    View Profile →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container-responsive section-padding">
          {/* Stats Grid */}
          <div className="w-full flex justify-center gap-8 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card-elegant w-80">
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-lg bg-primary-card ${stat.color}`}
                  >
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-primary-dark">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Student Submissions Section */}
            <div className="lg:col-span-3">
              <div className="card-elegant mb-8">
                <h2 className="text-2xl font-bold text-primary-dark mb-4">
                  Task Submissions from Students
                </h2>
                {submissions.length === 0 ? (
                  <div className="text-gray-600">No submissions yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm">Task</th>
                          <th className="px-4 py-2 text-left text-sm">
                            Student
                          </th>
                          <th className="px-4 py-2 text-left text-sm">
                            Submission Link
                          </th>
                          <th className="px-4 py-2 text-left text-sm">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub, idx) => (
                          <tr key={sub._id || idx} className="border-b">
                            <td className="px-4 py-2">{sub.taskTitle}</td>
                            <td className="px-4 py-2">
                              {typeof sub.student === "object"
                                ? `${sub.student.firstName || ""} ${
                                    sub.student.lastName || ""
                                  }`.trim() ||
                                  sub.student.username ||
                                  sub.student.email?.split("@")[0] ||
                                  "Unknown Student"
                                : sub.student}
                            </td>
                            <td className="px-4 py-2">
                              <a
                                href={sub.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-button underline"
                              >
                                View
                              </a>
                            </td>
                            <td className="px-4 py-2 capitalize">
                              <div>
                                <div className="font-medium text-primary-dark">
                                  {sub.status || "pending"}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Task: {sub.taskStatus || "unknown"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {(sub.status === "pending" ||
                                sub.status === "under-review") &&
                                !isAdminView && (
                                  <>
                                    <button
                                      className="btn-primary mr-2"
                                      onClick={() =>
                                        handleSubmissionAction(
                                          sub.taskId,
                                          typeof sub.student === "object"
                                            ? sub.student._id
                                            : sub.student,
                                          true
                                        )
                                      }
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn-ghost text-red-600"
                                      onClick={() =>
                                        handleSubmissionAction(
                                          sub.taskId,
                                          typeof sub.student === "object"
                                            ? sub.student._id
                                            : sub.student,
                                          false
                                        )
                                      }
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              {sub.status === "approved" && (
                                <span className="text-green-700 font-semibold">
                                  Approved
                                </span>
                              )}
                              {sub.status === "rejected" && (
                                <span className="text-red-700 font-semibold">
                                  Rejected
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            {/* Recent Tasks */}
            <div className="lg:col-span-2">
              <div className="card-elegant">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-primary-dark">
                    Recent Tasks
                  </h2>
                  <button
                    className="btn-ghost text-sm"
                    onClick={() => {
                      if (isAdminView && viewStartupId) {
                        const id = displayStartup._id || displayStartup.id || viewStartupId;
                        navigate(`/admin/startups/${id}/tasks`);
                      } else {
                        navigate("/startup/tasks");
                      }
                    }}
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {(tasks || []).slice(0, 5).map((task) => (
                    <div
                      key={task._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-soft transition-shadow bg-primary-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-primary-dark mb-1">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-700 mb-2">
                            {task.assignedStudent
                              ? `Assigned to ${
                                  task.assignedStudent.firstName || ""
                                } ${task.assignedStudent.lastName || ""}`
                              : "Unassigned"}
                          </p>
                          <div className="flex items-center space-x-4 mb-3">
                            <span
                              className={`badge ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("-", " ")}
                            </span>
                            <span className="text-sm text-gray-600">
                              Due:{" "}
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn-ghost p-2"
                          onClick={() => navigate(`/startup/tasks/${task._id}`)}
                        >
                          {/* <Eye className="w-4 h-4" /> */}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions & Analytics */}
            {!isAdminView && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="card-elegant">
                  <h2 className="text-2xl font-bold text-primary-dark mb-4">
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <button
                      className="w-full flex items-center p-3 text-left hover:bg-primary-card rounded-lg transition-colors"
                      onClick={() => navigate("/startup/tasks")}
                    >
                      <Briefcase className="w-5 h-5 text-primary-button mr-3" />
                      <span>View My Works</span>
                    </button>
                    <button
                      className="w-full flex items-center p-3 text-left hover:bg-primary-card rounded-lg transition-colors"
                      onClick={() => navigate("/startup/browse-students")}
                    >
                      <Users className="w-5 h-5 text-primary-button mr-3" />
                      <span>Browse Students</span>
                    </button>
                    <button
                      className="w-full flex items-center p-3 text-left hover:bg-primary-card rounded-lg transition-colors"
                      onClick={() => {
                        navigate("/profile");
                      }}
                    >
                      <Building className="w-5 h-5 text-primary-button mr-3" />
                      <span>Update Profile</span>
                    </button>
                  </div>
                </div>

                {/* Company Stats */}
                <div className="card-elegant">
                  <h2 className="text-2xl font-bold text-primary-dark mb-4">
                    Company Stats
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-primary-card rounded-lg">
                      <Building className="w-5 h-5 text-primary-button mr-3" />
                      <div>
                        <p className="font-medium text-primary-dark">
                          {profile?.companyName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {profile?.tier ? profile.tier.replace("-", " ") : ""}{" "}
                          Startup
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-primary-card rounded-lg">
                      <Users className="w-5 h-5 text-primary-button mr-3" />
                      <div>
                        <p className="font-medium text-primary-dark">
                          {(tasks || []).filter((t) => t.assignedStudent).length}{" "}
                          Students
                        </p>
                        <p className="text-sm text-gray-600">Currently working</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ...existing code...

export default StartupDashboard;
