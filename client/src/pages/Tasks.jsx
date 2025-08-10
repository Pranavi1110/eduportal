import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import api from "../services/api";
import toast from "react-hot-toast";

const Tasks = () => {
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState({});
  const [submitting, setSubmitting] = useState({});

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

  const renderTaskCard = (task, isAssigned) => (
    <div
      key={task._id}
      className="bg-primary-card/60 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition-shadow p-6 flex flex-col justify-between min-h-[320px]"
    >
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
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {task.status === "open"
              ? "Open"
              : task.status === "submitted"
              ? "Submitted"
              : task.status === "completed"
              ? "Completed"
              : task.status}
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
          {task.startup?.email && (
            <span className="ml-2 text-gray-500">({task.startup.email})</span>
          )}
        </div>
        {task.assignedStudent && (
          <div className="text-xs text-blue-700 mt-1">
            Assigned to:{" "}
            <span className="font-semibold">
              {task.assignedStudent.firstName} {task.assignedStudent.lastName}
            </span>
          </div>
        )}
      </div>

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
                className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-primary"
                value={submission[task._id] || ""}
                onChange={(e) => handleInput(task._id, e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold transition-colors"
                disabled={submitting[task._id]}
              >
                {submitting[task._id] ? "Submitting..." : "Submit"}
              </button>
            </form>
          ) : task.status === "completed" ? (
            <div className="flex flex-col gap-3">
              <div className="text-green-600 font-semibold text-center">
                ✅ Task Completed
              </div>
              <button
                onClick={() => (window.location.href = "/certificates")}
                className="bg-primary-button hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold "
              >
                📄 Download Certificate
              </button>
            </div>
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
        <meta name="description" content="Browse and manage tasks" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
        {/* <h2 className="text-3xl font-garamond font-bold mb-8 text-primary-dark">
          Your Tasks
        </h2> */}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Assigned Tasks */}
            <h3 className="text-2xl font-bold mb-4 text-primary-dark">
              Tasks Assigned to You
            </h3>
            {assignedTasks.length === 0 ? (
              <div className="text-gray-500 mb-8">No assigned tasks found.</div>
            ) : (
              <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {assignedTasks.map((task) => renderTaskCard(task, true))}
              </div>
            )}

            {/* All Tasks */}
            <h3 className="text-2xl font-bold mb-4 text-primary-dark">
              All Tasks Posted by Startups
            </h3>
            {(() => {
              // Only show tasks that are open and not assigned to this student
              const assignedIds = new Set(assignedTasks.map((t) => t._id));
              const openTasks = allTasks.filter(
                (task) =>
                  task.status === "open" &&
                  (!task.assignedStudent || !assignedIds.has(task._id))
              );
              return openTasks.length === 0 ? (
                <div className="text-gray-500">No tasks found.</div>
              ) : (
                <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 py-4">
                  {openTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-white rounded-3xl shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow p-8 flex flex-col justify-between min-h-[320px] relative group"
                      style={{ minHeight: 320 }}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-bold text-2xl text-primary-dark flex-1 truncate">
                            {task.title}
                          </div>
                          <span className="text-xs px-4 py-1 rounded-full font-bold ml-2 bg-blue-100 text-blue-700 shadow group-hover:bg-blue-200 group-hover:text-blue-900 transition-colors absolute top-6 right-6">
                            Open
                          </span>
                        </div>
                        <div className="text-gray-700 mb-3 text-base line-clamp-3">
                          {task.description}
                        </div>
                        <div className="flex flex-wrap gap-3 mb-3">
                          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded">
                            Category: {task.category}
                          </span>
                          <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded">
                            Skills: {task.skills?.join(", ")}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          Deadline:{" "}
                          <span className="font-medium">
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                          Posted by:{" "}
                          <span className="font-semibold">
                            {task.startup?.companyName || "Unknown"}
                          </span>
                          {task.startup?.email && (
                            <span className="ml-2 text-gray-500">
                              ({task.startup.email})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
};

export default Tasks;
