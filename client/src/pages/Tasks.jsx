import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Calendar,
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Plus,
  ArrowRight,
  Download,
  Eye,
  Star,
  TrendingUp,
  Award,
} from "lucide-react";

const Tasks = () => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Filter/sort states
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [startupFilter, setStartupFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleInput = (taskId, value) => {
    setSubmission((prev) => ({
      ...prev,
      [taskId]: value,
    }));
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

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        if (user?.userType === "startup") {
          // For startups: fetch only tasks posted by this startup
          const startupTasksRes = await api.get(`/startup/tasks`);
          console.log("Startup tasks response:", startupTasksRes.data);
          setAllTasks(startupTasksRes.data || []);
          setAssignedTasks([]); // Startups don't have assigned tasks
        } else {
          // For students: fetch assigned tasks and all available tasks
          const assignedRes = await api.get(`/student/dashboard`);
          setAssignedTasks(assignedRes.data.tasks || []);

          const allRes = await api.get(`/student/tasks/all`);
          setAllTasks(allRes.data || []);
        }
      } catch (e) {
        console.error("Error fetching tasks:", e);
      }
      setLoading(false);
    };
    
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Main filter + sort function
  const filterAndSortTasks = (tasks) => {
    let updated = [...tasks];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      updated = updated.filter((task) =>
        [task.title, task.description, task.category, ...(task.skills || [])]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter) {
      updated = updated.filter(
        (task) => task.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Deadline filter
    if (deadlineFilter) {
      updated = updated.filter(
        (task) => new Date(task.deadline) <= new Date(deadlineFilter)
      );
    }

    // Startup filter
    if (startupFilter) {
      updated = updated.filter((task) =>
        startupFilter === "true" ? !!task.startup : !task.startup
      );
    }

    // Sorting
    if (sortBy === "deadline") {
      updated.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === "title") {
      updated.sort((a, b) => a.title.localeCompare(b.title));
    }

    return updated;
  };

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

  const renderTaskCard = (task, isAssigned) => (
    <div
      key={task._id}
      className="card-elegant p-6 group"
    >
      {/* Header with status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(task.status)}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              task.status
            )}`}
          >
            {user?.userType === "startup" && task.submissions && task.submissions.length > 0 ? (
              (() => {
                const hasPending = task.submissions.some(s => s.status === "pending");
                const hasUnderReview = task.submissions.some(s => s.status === "under-review");
                const hasApproved = task.submissions.some(s => s.status === "approved");
                const allRejected = task.submissions.every(s => s.status === "rejected");
                
                if (hasApproved) return "completed";
                if (hasUnderReview) return "under-review";
                if (hasPending) return "submitted";
                if (allRejected) return "rejected";
                return task.status;
              })()
            ) : (
              task.status
            )}
          </span>
        </div>
        <div className="text-xs text-gray-600 bg-primary-card px-2 py-1 rounded-full border border-gray-200">
          <Calendar className="w-3 h-3 inline mr-1" />
          {new Date(task.deadline).toLocaleDateString()}
        </div>
      </div>

      {/* Task title and description */}
      <h3 className="font-bold text-xl text-primary-dark mb-3 group-hover:text-primary-button transition-colors">
        {task.title}
      </h3>
      <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
        {task.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="badge-secondary text-xs">
          <Briefcase className="w-3 h-3 mr-1" />
          {task.category}
        </span>
        {task.skills?.slice(0, 3).map((skill, idx) => (
          <span
            key={idx}
            className="badge-secondary text-xs"
          >
            <Star className="w-3 h-3 mr-1" />
            {skill}
          </span>
        ))}
        {task.skills?.length > 3 && (
          <span className="badge-secondary text-xs">
            +{task.skills.length - 3} more
          </span>
        )}
      </div>

      {/* Task details */}
      <div className="space-y-2 mb-4 text-sm">
        {user?.userType === "student" && (
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4" />
            <span>From: <span className="font-semibold">{task.startup?.companyName || "Unknown"}</span></span>
          </div>
        )}
        {user?.userType === "startup" && task.assignedStudent && (
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4" />
            <span>Assigned to: <span className="font-semibold">{task.assignedStudent.firstName} {task.assignedStudent.lastName}</span></span>
          </div>
        )}
      </div>

      {/* Submission form - only for students */}
      {user?.userType === "student" && (
        <div className="mt-6">
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
                  <>
                    {/* <Download className="w-4 h-4 mr-2" /> */}
                    Submit Task
                  </>
                )}
              </button>
            </form>
          ) : task.status === "submitted" ? (
            <div className="text-center py-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="w-6 h-6 text-yellow-700 mx-auto mb-2" />
              <div className="text-yellow-800 font-semibold">Link Submitted - Awaiting Review</div>
            </div>
          ) : task.status === "under-review" ? (
            <div className="text-center py-4 bg-orange-50 rounded-lg border border-orange-200">
              <Clock className="w-6 h-6 text-orange-700 mx-auto mb-2" />
              <div className="text-orange-800 font-semibold">Under Review - Please Wait</div>
            </div>
          ) : task.status === "completed" ? (
            <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-700 mx-auto mb-2" />
              <div className="text-green-800 font-semibold">✓ Task Completed</div>
            </div>
          ) : task.status === "rejected" ? (
            <div className="text-center py-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-6 h-6 text-red-700 mx-auto mb-2" />
              <div className="text-red-800 font-semibold">✗ Task Rejected</div>
            </div>
          ) : (
            <div className="text-center py-4 bg-primary-card rounded-lg border border-gray-200">
              <div className="text-gray-700 font-semibold">{task.status}</div>
            </div>
          )}
        </div>
      )}

      {/* For startups: Show submission count and status */}
      {user?.userType === "startup" && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
            <TrendingUp className="w-4 h-4" />
            <span>Submissions: <span className="font-semibold">{task.submissions?.length || 0}</span></span>
          </div>
          {task.submissions && task.submissions.length > 0 && (
            <div className="space-y-2">
              {task.submissions.map((submission, index) => {
                let studentName = "Unknown Student";
                if (submission.student) {
                  if (submission.student.firstName && submission.student.lastName) {
                    studentName = `${submission.student.firstName} ${submission.student.lastName}`;
                  } else if (submission.student.firstName) {
                    studentName = submission.student.firstName;
                  } else if (submission.student.lastName) {
                    studentName = submission.student.lastName;
                  } else if (submission.student.username) {
                    studentName = submission.student.username;
                  } else if (submission.student.email) {
                    studentName = submission.student.email.split('@')[0];
                  }
                }
                
                return (
                  <div key={index} className="bg-primary-card rounded-lg p-3 text-xs border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-primary-dark">{studentName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

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
            {user?.userType === "startup" ? "Your Posted Tasks" : "Available Tasks"}
          </h1>
          <p className="section-subtitle">
            {user?.userType === "startup" 
              ? "Manage and review task submissions from students"
              : "Browse and submit work for available opportunities"
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card-elegant mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
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

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-ghost"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Expanded Filters */}
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
                <option value="research">Research</option>
                <option value="content">Content</option>
              </select>

              <input
                type="date"
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="input-field-elegant"
                placeholder="Deadline"
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
          // Startup View
          <div>
            {allTasks.length === 0 ? (
              <div className="text-center py-16 card-elegant">
                <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-primary-dark mb-4">No tasks posted yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start posting tasks to connect with talented students and get your projects completed.
                </p>
                <button className="btn-primary mx-auto flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Post Your First Task
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterAndSortTasks(allTasks).map((task) => renderTaskCard(task, false))}
              </div>
            )}
          </div>
        ) : (
          // Student View
          <div className="space-y-12">
            {/* Assigned Tasks */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-button rounded-full"></div>
                <h2 className="text-2xl font-bold text-primary-dark">Your Assigned Tasks</h2>
              </div>
              
              {assignedTasks.length === 0 ? (
                <div className="text-center py-12 card-elegant">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary-dark mb-2">No assigned tasks</h3>
                  <p className="text-gray-600">You don't have any tasks assigned at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filterAndSortTasks(assignedTasks).map((task) => renderTaskCard(task, true))}
                </div>
              )}
            </div>

            {/* Available Tasks */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-primary-button rounded-full"></div>
                <h2 className="text-2xl font-bold text-primary-dark">Available Tasks</h2>
              </div>
              
              {allTasks.filter((t) => t.status === "open" && (!t.assignedStudent || t.assignedStudent._id !== user?.id)).length === 0 ? (
                <div className="text-center py-12 card-elegant">
                  <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary-dark mb-2">No available tasks</h3>
                  <p className="text-gray-600">Check back later for new opportunities.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterAndSortTasks(
                    allTasks.filter((t) => t.status === "open" && (!t.assignedStudent || t.assignedStudent._id !== user?.id))
                  ).map((task) => renderTaskCard(task, false))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
