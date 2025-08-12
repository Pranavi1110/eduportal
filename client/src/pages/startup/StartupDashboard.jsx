import React, { useEffect, useState } from "react";
import {
  fetchStartupNotifications,
  markStartupNotificationRead,
} from "../../routes/startupNotifications";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Building,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
} from "lucide-react";

const StartupDashboard = () => {
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
      const res = await api.get("/startup/dashboard");
      // Flatten all submissions from all tasks
      const allSubs = (res.data.tasks || []).flatMap((task) =>
        (task.submissions || []).map((sub) => ({
          ...sub,
          taskTitle: task.title,
          taskId: task._id,
          student: sub.student,
        }))
      );
      setSubmissions(allSubs);
    } catch (err) {
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
    fetchDashboard();
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
      color: "text-blue-600",
    },
    {
      label: "Students Hired",
      value: (tasks || []).filter((t) => t.assignedStudent).length,
      icon: Users,
      color: "text-green-600",
    },
    {
      label: "Total Spent",
      value: `$${(tasks || []).reduce(
        (sum, t) => sum + (t.budget?.max || 0),
        0
      )}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Avg. Rating",
      value: profile?.averageRating || "N/A",
      icon: TrendingUp,
      color: "text-purple-600",
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

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Helmet>
        <title>Startup Dashboard - Hubinity</title>
        <meta
          name="description"
          content="Startup dashboard for Hubinity platform"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-primary-white shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-garamond font-bold text-primary-dark">
                  Welcome back, {user?.firstName || profile?.companyName}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Here's what's happening with your startup
                </p>
              </div>
              <div className="flex space-x-3 items-center">
                {/* Notification Bell */}
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
                                <div className="font-medium">
                                  {notif.message}
                                </div>
                                <div className="text-xs text-gray-500">
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
                {/* ...existing buttons... */}
                <button
                  className="btn-secondary"
                  onClick={() => navigate("/startup/browse-students")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Browse Students
                </button>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/startup/post-task")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Task
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg bg-gray-100 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-primary-dark">
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
              <div className="card mb-8">
                <h2 className="text-xl font-semibold text-primary-dark mb-4">
                  Task Submissions from Students
                </h2>
                {submissions.length === 0 ? (
                  <div className="text-gray-500">No submissions yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left">Task</th>
                          <th className="px-4 py-2 text-left">Student</th>
                          <th className="px-4 py-2 text-left">
                            Submission Link
                          </th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Actions</th>
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
                                  }`
                                : sub.student}
                            </td>
                            <td className="px-4 py-2">
                              <a
                                href={sub.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                View
                              </a>
                            </td>
                            <td className="px-4 py-2 capitalize">
                              {sub.status || "pending"}
                            </td>
                            <td className="px-4 py-2">
                              {sub.status === "pending" && (
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
                                    className="btn-danger"
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
                                <span className="text-green-600 font-semibold">
                                  Approved
                                </span>
                              )}
                              {sub.status === "rejected" && (
                                <span className="text-red-600 font-semibold">
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
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-primary-dark">
                    Recent Tasks
                  </h2>
                  <button
                    className="btn-ghost text-sm"
                    onClick={() => navigate("/startup/tasks")}
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {(tasks || []).slice(0, 5).map((task) => (
                    <div
                      key={task._id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-soft transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-primary-dark mb-1">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {task.assignedStudent
                              ? `Assigned to ${
                                  task.assignedStudent.firstName || ""
                                } ${task.assignedStudent.lastName || ""}`
                              : "Unassigned"}{" "}
                            • ${task.budget?.max}
                          </p>
                          <div className="flex items-center space-x-4 mb-3">
                            <span
                              className={`badge ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("-", " ")}
                            </span>
                            <span className="text-sm text-gray-500">
                              Due:{" "}
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                          {/* Progress bar and completion % can be added if tracked */}
                        </div>
                        <button
                          className="btn-ghost p-2"
                          onClick={() => navigate(`/startup/tasks/${task._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions & Analytics */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-xl font-semibold text-primary-dark mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <button
                    className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => navigate("/startup/post-task")}
                  >
                    <Briefcase className="w-5 h-5 text-primary-button mr-3" />
                    <span>Post New Task</span>
                  </button>
                  <button
                    className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => navigate("/startup/browse-students")}
                  >
                    <Users className="w-5 h-5 text-primary-button mr-3" />
                    <span>Browse Students</span>
                  </button>
                  <button
                    className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => navigate("/startup/profile")}
                  >
                    <Building className="w-5 h-5 text-primary-button mr-3" />
                    <span>Update Profile</span>
                  </button>
                </div>
              </div>

              {/* Company Stats */}
              <div className="card">
                <h2 className="text-xl font-semibold text-primary-dark mb-4">
                  Company Stats
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Building className="w-5 h-5 text-blue-600 mr-3" />
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
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-primary-dark">
                        {(tasks || []).filter((t) => t.assignedStudent).length}{" "}
                        Students
                      </p>
                      <p className="text-sm text-gray-600">Currently working</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-primary-dark">
                        $
                        {(tasks || []).reduce(
                          (sum, t) => sum + (t.budget?.max || 0),
                          0
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Total spent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ...existing code...

export default StartupDashboard;
