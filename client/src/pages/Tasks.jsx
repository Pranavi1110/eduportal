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
        <h2 className="text-2xl font-bold mb-6">Your Tasks</h2>
        {loading ? (
          <div>Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="text-gray-500">No tasks found.</div>
        ) : (
          <div className="w-full max-w-3xl space-y-4">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="p-4 bg-white rounded shadow border"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-lg">{task.title}</div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
                    {task.status === "open"
                      ? "Open"
                      : task.status === "submitted"
                      ? "Submitted"
                      : task.status}
                  </span>
                </div>
                <div className="text-gray-600 mb-1">{task.description}</div>
                <div className="text-sm text-gray-500 mb-1">
                  Category: {task.category}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  Skills: {task.skills?.join(", ")}
                </div>
                <div className="text-sm text-gray-500">
                  Deadline: {new Date(task.deadline).toLocaleDateString()}
                </div>
                {task.assignedStudent && (
                  <div className="text-sm text-blue-600 mt-1">
                    Assigned to: {task.assignedStudent.firstName}{" "}
                    {task.assignedStudent.lastName}
                  </div>
                )}

                {/* Show submit link form only if status is open */}
                {task.status === "open" ? (
                  <form
                    className="mt-4 flex gap-2"
                    onSubmit={(e) => handleSubmit(e, task._id)}
                  >
                    <input
                      type="url"
                      placeholder="Submit your work link"
                      className="border rounded px-2 py-1 flex-1"
                      value={submission[task._id] || ""}
                      onChange={(e) => handleInput(task._id, e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="bg-primary text-black px-4 py-1 rounded"
                      disabled={submitting[task._id]}
                    >
                      {submitting[task._id] ? "Submitting..." : "Submit"}
                    </button>
                  </form>
                ) : (
                  <div className="mt-4 text-green-600 font-semibold">
                    Link Submitted
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
