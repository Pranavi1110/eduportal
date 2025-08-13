import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

const Submissions = () => {
  const { authData } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSubmissions();
  }, []);

  const fetchAllSubmissions = async () => {
    setLoading(true);
    try {
      // Use /startup/tasks instead of /startup/dashboard to get properly populated submissions
      const res = await api.get("/startup/tasks");
      const allSubs = (res.data || []).flatMap((task) =>
        (task.submissions || []).map((sub) => ({
          ...sub,
          taskTitle: task.title,
          taskId: task._id,
          taskStatus: task.status,
          student: sub.student,
        }))
      );
      console.log("Submissions data:", allSubs);
      console.log("Raw task data:", res.data);
      setSubmissions(allSubs);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setSubmissions([]);
    }
    setLoading(false);
  };

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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">
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
                <th className="px-4 py-2 text-left">Submission Link</th>
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
                        }`.trim() || sub.student.username || sub.student.email?.split('@')[0] || "Unknown Student"
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
                    <div>
                      <div className="font-medium">{sub.status || "pending"}</div>
                      <div className="text-xs text-gray-500">
                        Task: {sub.taskStatus || "unknown"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    {sub.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition"
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
                          className="px-4 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition"
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
                      </div>
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
  );
};

export default Submissions;
