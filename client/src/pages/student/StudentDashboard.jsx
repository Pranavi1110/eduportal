import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";

import { fetchStudentDashboard, submitTask, fetchBadgesCertificates } from "../../routes/student";
import { useAuth } from "../../hooks/useAuth";

const StudentDashboard = () => {
  const { user, authData } = useAuth();
  const token = authData?.token;
  const queryClient = useQueryClient();

  // Fetch student dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery(
    ["student-dashboard"],
    () => fetchStudentDashboard(token),
    { enabled: !!token }
  );

  // Fetch badges and certificates
  const { data: badgesCerts, isLoading: badgesLoading } = useQuery(
    ["badges-certificates"],
    () => fetchBadgesCertificates(token),
    { enabled: !!token }
  );

  // Submission state
  const [submission, setSubmission] = useState({});
  const submitTaskMutation = useMutation(
    ({ taskId, data }) => submitTask(token, taskId, data),
    {
      onSuccess: () => {
        toast.success("Task submitted!");
        queryClient.invalidateQueries(["student-dashboard"]);
      },
      onError: (err) => toast.error(err.message || "Submission failed"),
    }
  );

  if (dashboardLoading || badgesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const student = dashboard?.student || {};
  const tasks = dashboard?.tasks || [];
  const badges = badgesCerts?.badges || [];
  const certificates = badgesCerts?.certificates || [];

  const handleInput = (taskId, field, value) => {
    setSubmission((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value },
    }));
  };

  const handleSubmit = (e, taskId) => {
    e.preventDefault();
    submitTaskMutation.mutate({ taskId, data: submission[taskId] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Student Dashboard</title>
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-primary-dark">Student Dashboard</h1>
        <div className="flex items-center gap-6">
          <button title="Chat with Startups" className="relative text-xl">💬</button>
          <button title="Notifications" className="relative text-xl">🔔</button>
          <a href="/profile" className="flex items-center gap-2 hover:underline">
            👤 <span>Edit Profile</span>
          </a>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto py-8 px-4">
        {/* Assigned Tasks */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Assigned Tasks</h2>
          {tasks.length === 0 && <p>No tasks assigned yet.</p>}

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded shadow p-4 flex flex-col md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <div className="font-bold text-lg">{task.title}</div>
                  <div className="text-gray-500 text-sm">
                    Assigned by: {task.startupName}
                  </div>
                  <div className="text-gray-600 mt-2">{task.description}</div>
                </div>

                {/* Submission Form */}
                {task.status !== "submitted" && (
                  <form
                    className="mt-4 md:mt-0 w-full md:w-1/3 space-y-2"
                    onSubmit={(e) => handleSubmit(e, task._id)}
                  >
                    <input
                      type="text"
                      placeholder="Project Title"
                      className="input input-bordered w-full"
                      value={submission[task._id]?.title || ""}
                      onChange={(e) =>
                        handleInput(task._id, "title", e.target.value)
                      }
                      required
                    />
                    <input
                      type="url"
                      placeholder="GitHub or Deployed Link"
                      className="input input-bordered w-full"
                      value={submission[task._id]?.link || ""}
                      onChange={(e) =>
                        handleInput(task._id, "link", e.target.value)
                      }
                      required
                    />
                    <textarea
                      placeholder="Project Description"
                      className="textarea textarea-bordered w-full"
                      value={submission[task._id]?.description || ""}
                      onChange={(e) =>
                        handleInput(task._id, "description", e.target.value)
                      }
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={submitTaskMutation.isLoading}
                    >
                      Submit Task
                    </button>
                  </form>
                )}

                {task.status === "submitted" && (
                  <div className="mt-4 md:mt-0 text-green-600 font-medium">
                    ✅ Submitted
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Certificates Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Certificates</h2>
          {certificates.length === 0 && <p>No certificates available yet.</p>}
          <ul className="list-disc pl-5">
            {certificates.map((cert) => (
              <li key={cert._id}>
                <a
                  href={cert.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {cert.taskTitle} – Download Certificate
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Profile Quick Access */}
        <section>
          <a href="/profile" className="btn btn-outline">
            Edit Full Profile
          </a>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
