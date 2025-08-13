import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

const StartupTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/startup/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      toast.error("Failed to fetch tasks");
    }
    setLoading(false);
  };

  const handleMoveToReview = async (taskId, studentId) => {
    try {
      await api.post(`/startup/tasks/${taskId}/review`, { studentId });
      toast.success("Submission moved to under review");
      fetchTasks();
    } catch (err) {
      toast.error("Failed to move submission to review");
    }
  };

  const handleApprove = async (taskId, studentId, approve) => {
    try {
      const notes = reviewNotes[`${taskId}-${studentId}`] || "";
      await api.post(`/startup/tasks/${taskId}/approve`, { 
        studentId, 
        approve, 
        reviewNotes: notes 
      });
      toast.success(approve ? "Task approved!" : "Task rejected");
      setReviewNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[`${taskId}-${studentId}`];
        return newNotes;
      });
      fetchTasks();
    } catch (err) {
      toast.error("Failed to update submission status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "under-review":
        return "bg-orange-100 text-orange-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "submitted":
        return <AlertCircle className="w-4 h-4" />;
      case "under-review":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === "all") return true;
    if (activeTab === "open") return task.status === "open";
    if (activeTab === "submitted") return task.status === "submitted";
    if (activeTab === "under-review") return task.status === "under-review";
    if (activeTab === "completed") return task.status === "completed";
    return true;
  });

  const tabs = [
    { id: "all", label: "All Tasks", count: tasks.length },
    { id: "open", label: "Open", count: tasks.filter(t => t.status === "open").length },
    { id: "submitted", label: "Submitted", count: tasks.filter(t => t.status === "submitted").length },
    { id: "under-review", label: "Under Review", count: tasks.filter(t => t.status === "under-review").length },
    { id: "completed", label: "Completed", count: tasks.filter(t => t.status === "completed").length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Tasks - Startup Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
                <p className="text-gray-600 mt-1">
                  Manage tasks posted by your startup
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => navigate("/startup/post-task")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Post New Task
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tasks Grid */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                No tasks found in this category.
              </div>
              <button
                className="mt-4 btn-primary"
                onClick={() => navigate("/startup/post-task")}
              >
                Post Your First Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {task.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          <span className="ml-1">{task.status.replace("-", " ")}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-ghost p-2"
                      onClick={() => navigate(`/startup/tasks/${task._id}`)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Task Details */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {task.category}
                      </span>
                      {task.skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      Budget: ${task.budget?.min || 0} - ${task.budget?.max || 0}
                    </div>
                  </div>

                  {/* Submissions */}
                  {task.submissions && task.submissions.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Student Submissions ({task.submissions.length})
                      </h4>
                      <div className="space-y-3">
                        {task.submissions.map((submission, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded-lg p-3 border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {submission.student?.firstName} {submission.student?.lastName}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  submission.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                  submission.status === "under-review" ? "bg-orange-100 text-orange-800" :
                                  submission.status === "approved" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {submission.status}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <a
                                href={submission.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Submission
                              </a>
                            </div>

                            {/* Action Buttons */}
                            {submission.status === "pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMoveToReview(task._id, submission.student._id)}
                                  className="btn-secondary text-xs px-3 py-1"
                                >
                                  Move to Review
                                </button>
                                <button
                                  onClick={() => handleApprove(task._id, submission.student._id, false)}
                                  className="btn-danger text-xs px-3 py-1"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {submission.status === "under-review" && (
                              <div className="space-y-2">
                                <textarea
                                  placeholder="Add review notes (optional)"
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                  value={reviewNotes[`${task._id}-${submission.student._id}`] || ""}
                                  onChange={(e) => setReviewNotes(prev => ({
                                    ...prev,
                                    [`${task._id}-${submission.student._id}`]: e.target.value
                                  }))}
                                  rows="2"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprove(task._id, submission.student._id, true)}
                                    className="btn-primary text-xs px-3 py-1"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApprove(task._id, submission.student._id, false)}
                                    className="btn-danger text-xs px-3 py-1"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}

                            {submission.status === "approved" && (
                              <div className="text-green-600 text-sm font-medium">
                                ✓ Approved
                              </div>
                            )}

                            {submission.status === "rejected" && (
                              <div className="text-red-600 text-sm font-medium">
                                ✗ Rejected
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned Student */}
                  {task.assignedStudent && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          Assigned to:
                        </span>
                        <span className="text-sm text-gray-600">
                          {task.assignedStudent.firstName} {task.assignedStudent.lastName}
                        </span>
                        <button
                          className="btn-ghost p-1"
                          onClick={() => navigate(`/chat/${task.assignedStudent._id}`)}
                          title="Chat with student"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StartupTasks; 