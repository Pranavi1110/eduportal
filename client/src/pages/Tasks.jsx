import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import toast from "react-hot-toast";

const Tasks = () => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // NEW: filter/sort states
  const [categoryFilter, setCategoryFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [startupFilter, setStartupFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

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
        const assignedRes = await api.get(`/student/dashboard`);
        setAssignedTasks(assignedRes.data.tasks || []);

        const allRes = await api.get(`/student/tasks/all`);
        setAllTasks(allRes.data || []);
      } catch (e) {
        console.error("Error fetching tasks:", e);
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

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

  const renderTaskCard = (task, isAssigned) => (
    <div
      key={task._id}
      className="bg-primary-card/60 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-shadow p-6 flex flex-col justify-between min-h-[320px]"
    >
      {/* Task content */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="font-bold text-xl text-primary-dark flex-1 truncate">
            {task.title}
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-semibold ml-2 ${
              task.status === "open"
                ? "bg-blue-100 text-blue-700"
                : task.status === "submitted"
                ? "bg-yellow-100 text-yellow-700"
                : task.status === "completed"
                ? "bg-green-200 text-green-700 border border-green-400"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {task.status}
          </span>
        </div>
        <div className="text-gray-700 mb-2 line-clamp-3">
          {task.description}
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
            Category: {task.category}
          </span>
          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
            Skills: {task.skills?.join(", ")}
          </span>
        </div>
        <div className="text-xs text-gray-500 mb-1">
          Deadline:{" "}
          <span className="font-medium">
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          From:{" "}
          <span className="font-semibold">
            {task.startup?.companyName || "Unknown"}
          </span>
        </div>
      </div>

      {/* Submission form */}
      {isAssigned && (
        <div className="mt-6">
          {task.status === "open" ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => handleSubmit(e, task._id)}
            >
              <input
                type="url"
                placeholder="Submit your work link"
                className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                value={submission[task._id] || ""}
                onChange={(e) => handleInput(task._id, e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-primary-button hover:bg-primary-dark text-white px-5 py-2 rounded-lg"
                disabled={submitting[task._id]}
              >
                {submitting[task._id] ? "Submitting..." : "Submit"}
              </button>
            </form>
          ) : (
            <div className="text-yellow-600 font-semibold text-center mt-4">
              Link Submitted - Awaiting Review
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Helmet>
        <title>Tasks - Hubinity</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <input
                type="text"
                placeholder="Search tasks..."
                className="border border-gray-300 rounded-lg px-4 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border px-3 py-2 rounded-lg"
              >
                <option value="">All Categories</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
              </select>
              <input
                type="date"
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="border px-3 py-2 rounded-lg"
              />
              <select
                value={startupFilter}
                onChange={(e) => setStartupFilter(e.target.value)}
                className="border px-3 py-2 rounded-lg"
              >
                <option value="">All</option>
                <option value="true">Startup</option>
                <option value="false">Non-Startup</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border px-3 py-2 rounded-lg"
              >
                <option value="">Sort By</option>
                <option value="deadline">Deadline</option>
                <option value="title">Title</option>
              </select>
            </div>

            {/* Assigned Tasks */}
            <h3 className="text-2xl font-bold mb-4">Assigned to You</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filterAndSortTasks(assignedTasks).map((task) =>
                renderTaskCard(task, true)
              )}
            </div>

            {/* All Open Tasks */}
            <h3 className="text-2xl font-bold mt-8 mb-4">All Open Tasks</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterAndSortTasks(
                allTasks.filter((t) => t.status === "open")
              ).map((task) => renderTaskCard(task, false))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Tasks;
