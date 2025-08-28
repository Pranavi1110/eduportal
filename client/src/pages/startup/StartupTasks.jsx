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
      toast.error("Failed to fetch works");
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
      toast.success(approve ? "Work approved!" : "Work rejected");
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

  // Compute a UI-facing status based on submissions + task.status
  const deriveTaskStatus = (task) => {
    const submissions = task.submissions || [];
    if (submissions.some((s) => s.status === "under-review")) return "under-review";
    if (submissions.some((s) => s.status === "approved")) return "completed";
    // Hide the word "submitted" in UI by treating it as "open"
    if (task.status === "submitted") return "open";
    return task.status || "open";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
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
      case "under-review":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Precompute statuses for filtering and counts
  const tasksWithComputed = tasks.map((t) => ({ ...t, _uiStatus: deriveTaskStatus(t) }));

  const filteredTasks = tasksWithComputed.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "open") return task._uiStatus === "open";
    if (activeTab === "under-review") return task._uiStatus === "under-review";
    if (activeTab === "completed") return task._uiStatus === "completed";
    return true;
  });

  const tabs = [
    { id: "all", label: "All Works", count: tasksWithComputed.length },
    { id: "open", label: "Open", count: tasksWithComputed.filter((t) => t._uiStatus === "open").length },
    { id: "under-review", label: "Under Review", count: tasksWithComputed.filter((t) => t._uiStatus === "under-review").length },
    { id: "completed", label: "Completed", count: tasksWithComputed.filter((t) => t._uiStatus === "completed").length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-button border-t-transparent shadow-soft" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Works - Startup Dashboard</title>
      </Helmet>

      <div className="min-h-screen bg-primary-white">
        {/* Header */}
        <div className="gradient-bg-elegant text-primary-cta">
          <div className="container-responsive py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-garamond font-bold">My Works</h1>
                <p className="text-base md:text-lg text-gray-200 mt-1">
                  Manage works posted by your startup
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => navigate("/startup/post-work")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Post New Work
              </button>
            </div>
          </div>
        </div>

        <div className="container-responsive section-padding">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex flex-wrap gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-base ${
                    activeTab === tab.id
                      ? "border-primary-button text-primary-dark"
                      : "border-transparent text-gray-600 hover:text-primary-dark hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-primary-card text-primary-dark py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-200">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Works Grid */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 card-elegant">
              <div className="text-gray-500 text-lg">
                No works found in this category.
              </div>
              <button
                className="mt-6 btn-primary"
                onClick={() => navigate("/startup/post-work")}
              >
                Post Your First Work
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  className="card-elegant"
                >
                  {/* Work Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary-dark mb-2">
                        {task.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task._uiStatus)}`}>
                          {getStatusIcon(task._uiStatus)}
                          <span className="ml-1 capitalize">{task._uiStatus.replace("-", " ")}</span>
                        </span>
                        <span className="text-xs text-gray-600">
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

                  {/* Work Details */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-primary-card text-primary-dark text-xs px-2 py-1 rounded border border-gray-200">
                        {task.category}
                      </span>
                      {task.workType && (
                        <span className={`text-xs px-2 py-1 rounded border ${
                          task.workType === 'technical' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200' 
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {task.workType.charAt(0).toUpperCase() + task.workType.slice(1)}
                        </span>
                      )}
                      {task.skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-primary-card text-primary-dark text-xs px-2 py-1 rounded border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Submissions */}
                  {task.submissions && task.submissions.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-primary-dark mb-3">
                        Student Submissions ({task.submissions.length})
                      </h4>
                      <div className="space-y-3">
                        {task.submissions.map((submission, idx) => (
                          <div
                            key={idx}
                            className="bg-primary-card rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-primary-dark">
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
                              <span className="text-xs text-gray-600">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <a
                                href={submission.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-button hover:text-primary-dark text-sm flex items-center gap-1"
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
                                  className="btn-ghost text-red-600 text-xs px-3 py-1"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {submission.status === "under-review" && (
                              <div className="space-y-2">
                                <textarea
                                  placeholder="Add review notes (optional)"
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
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
                                    className="btn-ghost text-red-600 text-xs px-3 py-1"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}
                            {submission.status === "approved" && (
                              <div className="text-green-700 text-sm font-medium">✓ Approved</div>
                            )}
                            {submission.status === "rejected" && (
                              <div className="text-red-700 text-sm font-medium">✗ Rejected</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assigned Student */}
                  {task.assignedStudent && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary-dark">
                          Assigned to:
                        </span>
                        <span className="text-sm text-gray-700">
                          {task.assignedStudent.firstName} {task.assignedStudent.lastName}
                        </span>
                        <button
                          className="btn-ghost p-1"
                          onClick={() => navigate(`/chat/${task.assignedStudent._id}`)}
                          title="Chat with student"
                        >
                          <MessageSquare className="w-4 h-4 text-primary-button" />
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