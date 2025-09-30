import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import toast from "react-hot-toast";

// Import necessary components and hooks
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
  Bell,
  Calendar,
  Award,
  Users,
  ArrowRight,
  Plus,
  Search,
  Filter,
  X,
} from "lucide-react";
import Avatar from "../../components/common/Avatar";
import { fetchAllCertificates } from "../../routes/certificates";

const StudentDashboard = ({
  viewUserId = null,
  viewUserData = null,
  isAdminView = false,
}) => {
  const { user, authData } = useAuth();
  const navigate = useNavigate();

  // Startups state for mentorship/networking
  const [startups, setStartups] = useState([]);
  const [startupsLoading, setStartupsLoading] = useState(true);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [availableTasksLoading, setAvailableTasksLoading] = useState(true);
  // impersonation state when admin views another student's dashboard
  const [impersonatedDashboard, setImpersonatedDashboard] = useState(null);
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [impersonatedCertificates, setImpersonatedCertificates] = useState([]);

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
        const impersonatedId = viewUserId ? viewUserId : user?.id;
        const filteredTasks = (res.data || []).filter(
          (task) =>
            task.status === "open" &&
            (!task.assignedStudent || task.assignedStudent._id !== impersonatedId)
        );
        setAvailableTasks(filteredTasks);
      } catch {
        setAvailableTasks([]);
      }
      setAvailableTasksLoading(false);
    };

    fetchStartups();
    // fetch available tasks for own view, and also for admin impersonation
    if ((user?.id && !viewUserId) || (viewUserId && isAdminView)) {
      fetchAvailableTasks();
    }
  }, [user?.id, viewUserId, isAdminView]);
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
      enabled: !!token && !viewUserId,
      onSuccess: (data) => {
        console.log("[DEBUG] StudentDashboard dashboard:", data);
      },
    }
  );

  // If admin wants to view a specific student's dashboard, fetch profile + tasks and build the same shape
  useEffect(() => {
    if (!viewUserId) return;
    let cancelled = false;
    const fetchImpersonated = async () => {
      setImpersonateLoading(true);
      try {
        if (isAdminView) {
          // Use admin endpoint to fetch exact dashboard payload
          const data = await import("../../routes/admin").then((m) =>
            m.fetchAdminStudentDashboard(viewUserId)
          );
          if (!cancelled) {
            setImpersonatedDashboard({ student: data.user, tasks: data.tasks });
            setImpersonatedCertificates(Array.isArray(data.certificates) ? data.certificates : []);
          }
        } else {
          const profile =
            viewUserData ||
            (await api.get(`/users/${viewUserId}`).then((r) => r.data));
          // fetch all tasks and filter assigned/submitted tasks for this student
          const allTasksRes = await api.get("/student/tasks/all");
          const allTasks = allTasksRes.data || [];

          const sid = profile._id || profile.id || profile.email;
          const assigned = allTasks.filter((t) => {
            if (t.assignedTo) {
              if (Array.isArray(t.assignedTo))
                return (
                  t.assignedTo.includes(sid) ||
                  t.assignedTo.includes(profile.email)
                );
              return t.assignedTo === sid || t.assignedTo === profile.email;
            }
            if (t.assignedStudent) {
              const asid =
                typeof t.assignedStudent === "object"
                  ? t.assignedStudent._id
                  : t.assignedStudent;
              return asid === sid || asid === profile.email;
            }
            if (t.assignedStudents && Array.isArray(t.assignedStudents))
              return t.assignedStudents.includes(sid);
            return false;
          });

          const submitted = allTasks.filter((t) =>
            (t.submissions || []).some((sub) => {
              const subId =
                typeof sub.student === "object"
                  ? sub.student._id || sub.student.email
                  : sub.student;
              return subId === sid || subId === profile.email;
            })
          );

          // merge assigned + submitted (dedupe by _id)
          const mergedMap = {};
          [...assigned, ...submitted].forEach((t) => {
            mergedMap[t._id] = t;
          });
          const tasksForStudent = Object.values(mergedMap);

          if (!cancelled)
            setImpersonatedDashboard({
              student: profile,
              tasks: tasksForStudent,
            });
        }
      } catch (err) {
        console.error("Failed to fetch impersonated dashboard", err);
        // Fallback: compose impersonated dashboard from general endpoints
        try {
          const profile =
            viewUserData ||
            (await api.get(`/users/${viewUserId}`).then((r) => r.data));
          const allTasksRes = await api.get("/student/tasks/all");
          const allTasks = allTasksRes.data || [];
          const sid = profile._id || profile.id || profile.email;
          const assigned = allTasks.filter((t) => {
            if (t.assignedTo) {
              if (Array.isArray(t.assignedTo))
                return (
                  t.assignedTo.includes(sid) ||
                  t.assignedTo.includes(profile.email)
                );
              return t.assignedTo === sid || t.assignedTo === profile.email;
            }
            if (t.assignedStudent) {
              const asid =
                typeof t.assignedStudent === "object"
                  ? t.assignedStudent._id
                  : t.assignedStudent;
              return asid === sid || asid === profile.email;
            }
            if (t.assignedStudents && Array.isArray(t.assignedStudents))
              return t.assignedStudents.includes(sid);
            return false;
          });
          const submitted = allTasks.filter((t) =>
            (t.submissions || []).some((sub) => {
              const subId =
                typeof sub.student === "object"
                  ? sub.student._id || sub.student.email
                  : sub.student;
              return subId === sid || subId === profile.email;
            })
          );
          const mergedMap = {};
          [...assigned, ...submitted].forEach((t) => {
            mergedMap[t._id] = t;
          });
          const tasksForStudent = Object.values(mergedMap);
          if (!cancelled)
            setImpersonatedDashboard({
              student: profile,
              tasks: tasksForStudent,
            });
        } catch (fallbackErr) {
          console.error("Fallback impersonation also failed", fallbackErr);
          if (!cancelled)
            setImpersonatedDashboard({
              student: viewUserData || { email: viewUserId },
              tasks: [],
            });
        }
      }
      if (!cancelled) setImpersonateLoading(false);
    };
    fetchImpersonated();
    return () => {
      cancelled = true;
    };
  }, [viewUserId, viewUserData]);

  // Fetch badges and certificates
  const { data: badgesCerts, isLoading: badgesLoading } = useQuery(
    ["badges-certificates"],
    () => fetchBadgesCertificates(token),
    { enabled: !!token && !viewUserId }
  );

  // Fetch all certificates directly from Certificate collection
  const {
    data: allCertificates = [],
    isLoading: certificatesLoading,
    refetch: refetchCertificates,
  } = useQuery(["all-certificates"], () => fetchAllCertificates(token), {
    enabled: !!token && !viewUserId,
  });

  // Submission state
  const [submission, setSubmission] = useState({});
  const [submitting, setSubmitting] = useState({});

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (viewUserId) return; // don't fetch notifications when admin is viewing another student
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
  }, [token, viewUserId]);

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

  const loadingNow = viewUserId ? impersonateLoading : dashboardLoading;

  if (loadingNow || certificatesLoading) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-button border-t-transparent mx-auto mb-4 shadow-soft"></div>
          <div className="text-lg text-gray-700">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  // Choose dashboard source: real logged-in or impersonated
  const dashboardToShow = viewUserId
    ? impersonatedDashboard || { student: viewUserData || {}, tasks: [] }
    : dashboard || {};
  const student = dashboardToShow?.student || {};
  const tasks = dashboardToShow?.tasks || [];
  // When admin is viewing another student, prefer the impersonated student's profile for display
  const displayPerson = viewUserId ? student || viewUserData || {} : user || {};
  const certificates = viewUserId && isAdminView ? impersonatedCertificates : allCertificates;

  const assignedTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-700" />;
      case "submitted":
        return <AlertCircle className="w-5 h-5 text-yellow-700" />;
      case "under-review":
        return <Clock className="w-5 h-5 text-orange-700" />;
      default:
        return <Clock className="w-5 h-5 text-gray-700" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "submitted":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "under-review":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-primary-white">
      {/* Header with Notifications */}
      <div className="gradient-bg-elegant text-primary-cta sticky top-0 z-40">
        <div className="container-responsive py-6">
          <div className="flex justify-between items-center">
            <Avatar
              src={
                displayPerson?.profilePicture ||
                displayPerson?.avatar ||
                displayPerson?.image ||
                ""
              }
              name={`${
                displayPerson?.firstName ||
                displayPerson?.username ||
                (displayPerson?.email || "").split("@")[0] ||
                "User"
              } ${displayPerson?.lastName || ""}`.trim()}
              sizeClass="w-12 h-12"
              className="rounded-md"
            />
            <div className="relative">
              <button
                title="Notifications"
                className="relative p-3 rounded-full bg-primary-card text-primary-dark shadow-soft hover:shadow-medium transition-all duration-200 border border-gray-200"
                onClick={() => setShowNotifications((prev) => !prev)}
              >
                <Bell className="w-6 h-6" />
                {!isAdminView &&
                  notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] flex items-center justify-center">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
              </button>

              {showNotifications && (
                <div className="absolute top-12 right-0 bg-primary-white rounded-xl shadow-elegant border border-gray-200 w-80 z-50 p-4 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-primary-dark">
                      Notifications
                    </h3>
                    <button
                      className="text-gray-500 hover:text-primary-dark p-1 rounded-full hover:bg-primary-card"
                      onClick={() => setShowNotifications(false)}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {notifications.filter((n) => !n.read).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications
                        .filter((notif) => !notif.read)
                        .map((notif, idx) => (
                          <div
                            key={notif._id || idx}
                            className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 hover:shadow-soft transition-shadow"
                          >
                            <div className="font-medium text-primary-dark mb-1">
                              {notif.message}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {new Date(notif.createdAt).toLocaleString()}
                            </div>
                            {notif.link && (
                              <button
                                onClick={() => handleNotificationClick(notif)}
                                className="text-primary-button hover:text-primary-dark text-sm font-medium"
                              >
                                View Details →
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <section className="container-responsive section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Profile Card */}
          <div className="card-elegant">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary-button flex items-center justify-center text-2xl text-primary-dark font-bold shadow-soft">
                {displayPerson?.firstName
                  ? displayPerson.firstName.charAt(0).toUpperCase()
                  : displayPerson?.email
                  ? displayPerson.email.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div>
                <div className="text-xl font-semibold text-primary-dark">
                  {displayPerson?.firstName} {displayPerson?.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {displayPerson?.email}
                </div>
                {viewUserId ? (
                  <button
                    onClick={() => {
                      const id =
                        displayPerson._id ||
                        displayPerson.id ||
                        displayPerson.email;
                      if (isAdminView) {
                        // keep profile viewing from admin if needed
                        navigate(`/admin/students/${id}/profile`);
                        return;
                      }
                      if (user?.userType === "startup") {
                        navigate(`/startup/students/${id}`);
                        return;
                      }
                      navigate(`/startup/students/${id}`);
                    }}
                    className="btn-ghost text-sm mt-2"
                  >
                    View Profile →
                  </button>
                ) : (
                  !isAdminView && (
                    <button
                      onClick={() => navigate("/profile")}
                      className="text-primary-button hover:text-primary-dark text-sm font-medium mt-1"
                    >
                      Edit Profile →
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="rounded-2xl shadow-soft p-6 text-primary-dark bg-primary-card border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{assignedTasks.length}</div>
                <div className="text-gray-600">Active Tasks</div>
              </div>
              <Briefcase className="w-8 h-8 text-primary-button" />
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="rounded-2xl shadow-soft p-6 text-primary-dark bg-primary-card border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">
                  {completedTasks.length}
                </div>
                <div className="text-gray-600">Completed</div>
              </div>
              <Trophy className="w-8 h-8 text-primary-button" />
            </div>
          </div>

          {/* Certificates */}
          <div className="rounded-2xl shadow-soft p-6 text-primary-dark bg-primary-card border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold">{certificates.length}</div>
                <div className="text-gray-600">Certificates</div>
              </div>
              <Award className="w-8 h-8 text-primary-button" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-8">
            {/* Assigned Tasks */}
            <div className="card-elegant">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary-button" />
                  {isAdminView && viewUserId ? "Active Tasks" : "My Active Tasks"}
                </h2>
                <button
                  onClick={() => {
                    if (isAdminView && viewUserId) {
                      const id = displayPerson._id || displayPerson.id || viewUserId;
                      navigate(`/admin/students/${id}/tasks`);
                    } else {
                      navigate("/tasks");
                    }
                  }}
                  className="btn-primary"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  View All
                </button>
              </div>

              {assignedTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary-dark mb-2">
                    No active tasks
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any tasks assigned at the moment.
                  </p>
                  <button
                    onClick={() => navigate("/tasks")}
                    className="btn-secondary"
                  >
                    Browse Available Tasks
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedTasks.map((task) => (
                    <div
                      key={task._id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-soft transition-shadow bg-primary-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(task.status)}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status.replace("-", " ")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      </div>

                      <h3 className="font-semibold text-lg text-primary-dark mb-2">
                        {task.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge-secondary text-xs">
                          {task.category}
                        </span>
                        {task.skills?.slice(0, 2).map((skill, idx) => (
                          <span key={idx} className="badge-secondary text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          From:{" "}
                          <span className="font-semibold">
                            {task.startup?.companyName || "Unknown"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate("/tasks")}
                            className="btn-ghost"
                          >
                            View Details
                          </button>
                          {!isAdminView && !viewUserId && (
                            <button
                              onClick={() =>
                                navigate(`/chat/${task.startup?._id}`)
                              }
                              className="p-2 text-primary-button hover:bg-primary-card rounded-lg transition-colors"
                              title="Chat with startup"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Tasks */}
            <div className="card-elegant">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-button" />
                  Available Tasks
                </h2>
              </div>

              {availableTasksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-button border-t-transparent mx-auto mb-2"></div>
                  <p className="text-gray-700">Loading available tasks...</p>
                </div>
              ) : availableTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No available tasks at the moment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableTasks.slice(0, 3).map((task) => (
                    <div
                      key={task._id}
                      className="border border-gray-200 rounded-xl p-6 bg-primary-white hover:shadow-soft transition-shadow"
                    >
                      <h3 className="font-semibold text-lg text-primary-dark mb-2">
                        {task.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge-secondary text-xs">
                          {task.category}
                        </span>
                        {task.skills?.slice(0, 2).map((skill, idx) => (
                          <span key={idx} className="badge-secondary text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-gray-600 mb-4">
                        Deadline: {new Date(task.deadline).toLocaleDateString()}
                      </div>

                      <div className="text-sm text-gray-700 mb-4">
                        From:{" "}
                        <span className="font-semibold">
                          {task.startup?.companyName || "Unknown"}
                        </span>
                      </div>

                      {!isAdminView && !viewUserId && (
                        <div className="space-y-3">
                          <input
                            type="url"
                            placeholder="Submit your work link"
                            className="input-field-elegant text-sm"
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
                              className="btn-primary flex-1"
                              onClick={() =>
                                handleSubmitTask(
                                  task._id,
                                  submission[task._id]
                                )
                              }
                              disabled={
                                submitting[task._id] ||
                                !submission[task._id]?.trim()
                              }
                            >
                              {submitting[task._id]
                                ? "Submitting..."
                                : "Submit Task"}
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/chat/${task.startup?._id}`)
                              }
                              className="p-2 text-primary-button hover:bg-primary-card rounded-lg transition-colors"
                              title="Chat with startup"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {availableTasks.length > 3 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => {
                      if (isAdminView && viewUserId) {
                        const id = displayPerson._id || displayPerson.id || viewUserId;
                        navigate(`/admin/students/${id}/tasks`);
                      } else {
                        navigate("/tasks");
                      }
                    }}
                    className="btn-ghost"
                  >
                    View All Available Tasks
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="card-elegant">
                <h2 className="text-2xl font-bold text-primary-dark flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-primary-button" />
                  Recently Completed
                </h2>
                <div className="space-y-3">
                  {completedTasks.slice(0, 3).map((task) => (
                    <div
                      key={task._id}
                      className="bg-green-50 rounded-lg border border-green-200 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-700" />
                        <span className="text-green-800 font-medium text-sm">
                          Completed
                        </span>
                      </div>
                      <h3 className="font-semibold text-primary-dark text-sm mb-1">
                        {task.title}
                      </h3>
                      <div className="text-xs text-gray-600 mb-2">
                        {task.completedAt
                          ? new Date(task.completedAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                      {isAdminView && viewUserId ? (
                        (() => {
                          const submission = task.submissions?.find(sub => 
                            (typeof sub.student === "object" ? sub.student?._id : sub.student) === (displayPerson._id || displayPerson.id || viewUserId)
                          );
                          return submission?.link ? (
                            <a
                              href={submission.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-button hover:text-primary-dark text-xs font-medium"
                            >
                              {submission.link}
                            </a>
                          ) : (
                            <span className="text-gray-500 text-xs">No submission link</span>
                          );
                        })()
                      ) : (
                        <button
                          onClick={() => navigate("/certificates")}
                          className="text-primary-button hover:text-primary-dark text-xs font-medium"
                        >
                          View Certificate →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Networking Opportunities */}
            {!isAdminView && !viewUserId && (
            <div className="card-elegant">
              <h2 className="text-2xl font-bold text-primary-dark flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-button" />
                Networking
              </h2>
              {startupsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-primary-button border-t-transparent mx-auto"></div>
                </div>
              ) : startups.length === 0 ? (
                <p className="text-gray-700 text-sm">No startups found.</p>
              ) : (
                <div className="space-y-3">
                  {startups.slice(0, 8).map((startup) => {
                    const logo =
                      startup.profilePicture ||
                      startup.logo ||
                      startup.companyLogo ||
                      startup.avatar ||
                      startup.image ||
                      "/vite.svg";
                    const name =
                      startup.companyName ||
                      startup.firstName ||
                      startup.username ||
                      "Startup";
                    const email = startup.email || startup.contactEmail || "";
                    return (
                      <div
                        key={startup._id}
                        className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                      >
                        {(() => {
                          const imgSrc =
                            startup.profilePicture ||
                            startup.logo ||
                            startup.companyLogo ||
                            startup.avatar ||
                            "";
                          const displayName = name || "Company";
                          const initials = displayName
                            .split(" ")
                            .map((w) => w.charAt(0))
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();
                          return imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={displayName}
                              className="w-12 h-12 rounded-md object-cover border"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-sm font-semibold text-primary-dark border">
                              {initials}
                            </div>
                          );
                        })()}

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-primary-dark truncate">
                            {name}
                          </div>
                          {email && (
                            <div className="text-xs text-gray-500 truncate">
                              {email}
                            </div>
                          )}
                          {startup.companyDescription && (
                            <div className="text-xs text-gray-600 truncate mt-1">
                              {startup.companyDescription}
                            </div>
                          )}
                        </div>

                        {!isAdminView && !viewUserId && (
                          <div>
                            <button
                              onClick={() => navigate(`/chat/${startup._id}`)}
                              className="btn-secondary text-sm px-3 py-1"
                            >
                              Connect
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-4">
                For more opportunities, check the community or contact your
                program coordinator.
              </div>
            </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
