import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import api from "../services/api";
import toast from "react-hot-toast";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState({});
  const [submitting, setSubmitting] = useState({});

  // Handle input change for link submission
  const handleInput = (taskId, value) => {
    setSubmission((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  // Handle link submission
  const handleSubmit = async (e, taskId) => {
    e.preventDefault();
    if (!submission[taskId]) return;
    setSubmitting((prev) => ({ ...prev, [taskId]: true }));
    try {
      await api.post(`/student/tasks/${taskId}/submit-link`, {
        link: submission[taskId],
      });
      toast.success("Link submitted successfully!");
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t._id === taskId ? { ...t, status: "submitted" } : t
        )
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
        const res = await api.get(`/student/dashboard`);
        console.log("Tasks response from backend:", res.data);
        setTasks(res.data.tasks || []);
      } catch (e) {
        console.error("Error fetching tasks:", e);
      }

      setLoading(false);
    };

    fetchTasks();
  }, []);

  return (
    <div>
      <Helmet>
        <title>Tasks - Hubinity</title>
        <meta name="description" content="Browse and manage tasks" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
        <h2 className="text-3xl font-garamond font-bold mb-8 text-primary-dark">
          Your Tasks
        </h2>
        {loading ? (
          <div>Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-gray-500">No tasks found.</div>
        ) : (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {tasks
              .slice()
              .sort((a, b) => {
                // Open and submitted first, completed last
                const order = { open: 0, submitted: 1, completed: 2 };
                return (order[a.status] ?? 99) - (order[b.status] ?? 99);
              })
              .map((task) => (
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
                    {task.assignedStudent && (
                      <div className="text-xs text-blue-700 mt-1">
                        Assigned to:{" "}
                        <span className="font-semibold">
                          {task.assignedStudent.firstName}{" "}
                          {task.assignedStudent.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-6">
                    {/* Show submit link form only if status is open */}
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
                          onChange={(e) =>
                            handleInput(task._id, e.target.value)
                          }
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
                          onClick={() =>
                            (window.location.href = "/certificates")
                          }
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
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
