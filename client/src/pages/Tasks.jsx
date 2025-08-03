import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import api from "../services/api";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await api.get("/startup/dashboard");
        setTasks(res.data.tasks || []);
      } catch {
        setTasks([]);
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

  return (
    <>
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
                    {task.status}
                  </span>
                </div>
                <div className="text-gray-600 mb-1">{task.description}</div>
                <div className="text-sm text-gray-500 mb-1">
                  Category: {task.category} | Difficulty: {task.difficulty}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Tasks;
