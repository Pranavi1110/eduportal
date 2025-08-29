import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { fetchAllStudents } from "../services/students";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Calendar,
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react";
import Avatar from "../components/common/Avatar";
const Tasks = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [startupProfile, setStartupProfile] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsDisplayCount, setStudentsDisplayCount] = useState(12);

  const [expandedTasks, setExpandedTasks] = useState({});
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [startupFilter, setStartupFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [submission, setSubmission] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        if (user?.userType === "startup") {
          const res = await api.get(`/startup/tasks`);
          setAllTasks(res.data || []);
          setAssignedTasks([]);
          // fetch startup profile for header
          try {
            const p = await api.get(`/startup/dashboard`);
            setStartupProfile(p.data.startup || p.data);
          } catch (e) {
            console.warn("Failed to fetch startup profile", e);
          }
        } else {
          const assignedRes = await api.get(`/student/dashboard`);
          setAssignedTasks((assignedRes.data && assignedRes.data.tasks) || []);
          const allRes = await api.get(`/student/tasks/all`);
          setAllTasks(allRes.data || []);
        }
      } catch (err) {
        console.error("Error fetching tasks", err);
      }
      setLoading(false);
    };

    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const data = await fetchAllStudents();
        setStudents(Array.isArray(data) ? data : data?.users || []);
      } catch (err) {
        console.error("Failed to fetch students", err);
        setStudents([]);
      }
      setStudentsLoading(false);
    };

    if (user) {
      fetchTasks();
      fetchStudents();
    }
  }, [user]);

  // ... rest of component functions and render logic follow unchanged

  const formatSkill = (s) => (typeof s === "string" ? s : s.name || "");

  const filterAndSortTasks = (tasks) => {
    let updated = [...tasks];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      updated = updated.filter((task) => {
        const skillStrings = (task.skills || []).map((s) => formatSkill(s));
        return [task.title, task.description, task.category, ...skillStrings]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term));
      });
    }
    if (categoryFilter) {
      updated = updated.filter(
        (task) => task.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    if (deadlineFilter) {
      updated = updated.filter(
        (task) => new Date(task.deadline) <= new Date(deadlineFilter)
      );
    }
    if (startupFilter) {
      updated = updated.filter((task) =>
        startupFilter === "true" ? !!task.startup : !task.startup
      );
    }
    if (sortBy === "deadline") {
      updated.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === "title") {
      updated.sort((a, b) => a.title.localeCompare(b.title));
    }
    return updated;
  };

  const toggleExpand = (id) =>
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));

  const openLightbox = (images, idx = 0) => {
    setLightboxImages(images || []);
    setLightboxIndex(idx || 0);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevLightbox = () => setLightboxIndex((i) => Math.max(0, i - 1));
  const nextLightbox = () =>
    setLightboxIndex((i) => Math.min(lightboxImages.length - 1, i + 1));

  const handleInput = (taskId, value) => {
    setSubmission((prev) => ({ ...prev, [taskId]: value }));
  };

  const handleSubmit = async (e, taskId) => {
    e.preventDefault();
    if (!submission[taskId]) return;
    setSubmitting((prev) => ({ ...prev, [taskId]: true }));
    try {
      await api.post(`/student/tasks/${taskId}/submit-link`, {
        link: submission[taskId],
      });
      toast.success("Link submitted successfully!");
      setAssignedTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "submitted" } : t))
      );
      setSubmission((prev) => ({ ...prev, [taskId]: "" }));
    } catch (err) {
      toast.error("Failed to submit link.");
      console.error(err);
    }
    setSubmitting((prev) => ({ ...prev, [taskId]: false }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-700" />;
      case "submitted":
        return <AlertCircle className="w-5 h-5 text-yellow-700" />;
      case "under-review":
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "submitted":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "under-review":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-primary-card text-gray-700 border-gray-200";
    }
  };

  const renderTaskCard = (task, isAssigned) => {
    const images = [];
    if (task.imageUrl) images.push(task.imageUrl);
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((a) => {
        if (a.url && !images.includes(a.url)) images.push(a.url);
      });
    }

    return (
      <div key={task._id} className="card-elegant p-6 group">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {(() => {
              const startup = task.startup;
              const imgSrc =
                startup && typeof startup === "object"
                  ? startup.profilePicture ||
                    startup.logo ||
                    startup.companyLogo ||
                    startup.avatar ||
                    ""
                  : "";
              const name =
                startup?.companyName || startup?.firstName || "Company";
              const initials = name
                .split(" ")
                .map((w) => w.charAt(0))
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return imgSrc ? (
                <img
                  src={imgSrc}
                  alt={name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 bg-gray-50"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-semibold text-primary-dark border border-gray-200">
                  {initials}
                </div>
              );
            })()}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                {getStatusIcon(task.status)}
                <div>
                  <div className="text-sm text-gray-600">
                    Posted by{" "}
                    {task.startup?.companyName ||
                      task.startup?.firstName ||
                      "Unknown"}
                  </div>
                  <h3 className="font-bold text-lg text-primary-dark group-hover:text-primary-button transition-colors">
                    {task.title}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-primary-card px-2 py-1 rounded-full border border-gray-200">
                <Calendar className="w-3 h-3 inline mr-1" />
                {task.deadline
                  ? new Date(task.deadline).toLocaleDateString()
                  : "-"}
              </div>
            </div>

            <div className="mb-3">
              <p
                className="text-gray-700 text-sm leading-relaxed"
                style={
                  expandedTasks[task._id]
                    ? {}
                    : {
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }
                }
              >
                {task.description}
              </p>

              {images.length > 0 && (
                <div
                  className={`mt-3 ${
                    expandedTasks[task._id] ? "mb-3" : "mb-0"
                  }`}
                >
                  <img
                    src={images[0]}
                    alt={task.title}
                    role="button"
                    onClick={() => openLightbox(images, 0)}
                    className={`w-full cursor-pointer ${
                      expandedTasks[task._id]
                        ? "max-h-64 object-cover"
                        : "max-h-28 object-cover rounded-md"
                    } rounded-md border border-gray-100`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/vite.svg";
                    }}
                  />
                </div>
              )}

              {task.description && (
                <button
                  type="button"
                  onClick={() => toggleExpand(task._id)}
                  className="text-sm text-primary-button mt-2"
                  aria-expanded={!!expandedTasks[task._id]}
                >
                  {expandedTasks[task._id] ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge-secondary text-xs">
                <Briefcase className="w-3 h-3 mr-1" />
                {task.category}
              </span>
              {task.workType && (
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    task.workType === "technical"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-green-100 text-green-800 border-green-200"
                  }`}
                >
                  {task.workType.charAt(0).toUpperCase() +
                    task.workType.slice(1)}
                </span>
              )}
              {task.skills?.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="badge-secondary text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  {formatSkill(skill)}
                </span>
              ))}
              {task.skills?.length > 3 && (
                <span className="badge-secondary text-xs">
                  +{task.skills.length - 3} more
                </span>
              )}
            </div>

            {user?.userType === "student" && (
              <div className="mt-2">
                {task.status === "open" ? (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => handleSubmit(e, task._id)}
                  >
                    <input
                      type="url"
                      placeholder="Submit your work link"
                      className="input-field-elegant text-sm"
                      value={submission[task._id] || ""}
                      onChange={(e) => handleInput(task._id, e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="btn-primary w-full"
                      disabled={submitting[task._id]}
                    >
                      {submitting[task._id] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-dark mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>Submit Task</>
                      )}
                    </button>
                  </form>
                ) : (
                  <div
                    className={`text-center py-4 rounded-lg border ${
                      task.status === "submitted"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                        : task.status === "completed"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-primary-card border-gray-200 text-gray-700"
                    }`}
                  >
                    {task.status === "submitted" ? (
                      <>
                        <AlertCircle className="w-6 h-6 text-yellow-700 mx-auto mb-2" />
                        <div className="font-semibold">
                          Link Submitted - Awaiting Review
                        </div>
                      </>
                    ) : task.status === "under-review" ? (
                      <>
                        <Clock className="w-6 h-6 text-orange-700 mx-auto mb-2" />
                        <div className="font-semibold">
                          Under Review - Please Wait
                        </div>
                      </>
                    ) : task.status === "completed" ? (
                      <>
                        <CheckCircle className="w-6 h-6 text-green-700 mx-auto mb-2" />
                        <div className="font-semibold">✓ Task Completed</div>
                      </>
                    ) : (
                      <div className="font-semibold">{task.status}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user?.userType === "startup" &&
              task.submissions &&
              task.submissions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      Submissions:{" "}
                      <span className="font-semibold">
                        {task.submissions.length}
                      </span>
                    </span>
                  </div>
                  {task.submissions.map((submissionItem, index) => {
                    let studentName = "Unknown Student";
                    if (submissionItem.student) {
                      const st = submissionItem.student;
                      studentName =
                        (st.firstName ||
                          st.username ||
                          st.email?.split("@")[0]) +
                        (st.lastName ? ` ${st.lastName}` : "");
                    }
                    return (
                      <div
                        key={index}
                        className="bg-primary-card rounded-lg p-3 text-xs border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary-dark">
                            {studentName}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              submissionItem.status
                            )}`}
                          >
                            {submissionItem.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-button border-t-transparent mx-auto mb-4 shadow-soft"></div>
          <div className="text-lg text-gray-700">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-white">
      <Helmet>
        <title>Tasks - Hubinity</title>
      </Helmet>

      <div className="container-responsive section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title mb-2">
            {user?.userType === "startup"
              ? "Your Posted Tasks"
              : "Available Tasks"}
          </h1>
          <p className="section-subtitle">
            {user?.userType === "startup"
              ? "Manage and review task submissions from students"
              : "Browse and submit work for available opportunities"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card-elegant mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or skills..."
                className="input-field-elegant pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-ghost"
            >
              <Filter className="w-5 h-5 mr-2" /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field-elegant"
              >
                <option value="">All Categories</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>

              <input
                type="date"
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="input-field-elegant"
              />

              {user?.userType === "student" && (
                <select
                  value={startupFilter}
                  onChange={(e) => setStartupFilter(e.target.value)}
                  className="input-field-elegant"
                >
                  <option value="">All Sources</option>
                  <option value="true">Startup</option>
                  <option value="false">Non-Startup</option>
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field-elegant"
              >
                <option value="">Sort By</option>
                <option value="deadline">Deadline</option>
                <option value="title">Title</option>
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        {user?.userType === "startup" ? (
          <div>
            {allTasks.length === 0 ? (
              <div className="text-center py-16 card-elegant">
                <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-primary-dark mb-4">
                  No tasks posted yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start posting tasks to connect with talented students and get
                  your projects completed.
                </p>
                <Link
                  to="/startup/post-work"
                  className="btn-primary mx-auto flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Post Your First Task
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterAndSortTasks(allTasks).map((task) =>
                  renderTaskCard(task, false)
                )}
              </div>
            )}

            {/* Students list removed for startup view */}
          </div>
        ) : (
          // Student view
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-button rounded-full"></div>
                <h2 className="text-2xl font-bold text-primary-dark">
                  Your Assigned Tasks
                </h2>
              </div>

              {assignedTasks.length === 0 ? (
                <div className="text-center py-12 card-elegant">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary-dark mb-2">
                    No assigned tasks
                  </h3>
                  <p className="text-gray-600">
                    You don't have any tasks assigned at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filterAndSortTasks(assignedTasks).map((task) =>
                    renderTaskCard(task, true)
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-button rounded-full"></div>
                <h2 className="text-2xl font-bold text-primary-dark">
                  Available Tasks
                </h2>
              </div>

              {allTasks.filter(
                (t) =>
                  t.status === "open" &&
                  (!t.assignedStudent || t.assignedStudent._id !== user?.id)
              ).length === 0 ? (
                <div className="text-center py-12 card-elegant">
                  <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary-dark mb-2">
                    No available tasks
                  </h3>
                  <p className="text-gray-600">
                    Check back later for new opportunities.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterAndSortTasks(
                    allTasks.filter(
                      (t) =>
                        t.status === "open" &&
                        (!t.assignedStudent ||
                          t.assignedStudent._id !== user?.id)
                    )
                  ).map((task) => renderTaskCard(task, false))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <div className="bg-white rounded-md overflow-hidden">
              <div className="p-2 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {lightboxIndex + 1} / {lightboxImages.length}
                </div>
                <div className="flex gap-2">
                  <button onClick={prevLightbox} className="btn-ghost">
                    Prev
                  </button>
                  <button onClick={nextLightbox} className="btn-ghost">
                    Next
                  </button>
                  <button onClick={closeLightbox} className="btn-ghost">
                    Close
                  </button>
                </div>
              </div>
              <div className="bg-black">
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt={`img-${lightboxIndex}`}
                  className="w-full max-h-[70vh] object-contain bg-black"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/vite.svg";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
