import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import { Calendar, Briefcase, CheckCircle, Clock, AlertCircle, Star, X, Users } from "lucide-react";

const AdminStartupTasks = () => {
  const { startupId } = useParams();
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState([]);
  const [startup, setStartup] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        // fetch startup profile for header
        try {
          const u = await api.get(`/users/${startupId}`);
          setStartup(u.data);
        } catch (_) {
          setStartup(null);
        }
        // fetch all tasks and filter those belonging to this startup
        try {
          const res = await api.get("/student/tasks/all");
          const tasks = Array.isArray(res.data) ? res.data : [];
          const filtered = tasks.filter((t) => {
            if (!t.startup) return false;
            return (
              (typeof t.startup === "object" && t.startup._id === startupId) ||
              t.startup === startupId
            );
          });
          setAllTasks(filtered);
        } catch (e) {
          console.error("Error fetching tasks:", e);
          setAllTasks([]);
        }
      } catch (e) {
        setAllTasks([]);
      }
      setLoading(false);
    };
    run();
  }, [startupId]);

  const toggleExpand = (id) =>
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));

  const openLightbox = (images, idx = 0) => {
    setLightboxImages(images || []);
    setLightboxIndex(idx || 0);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const prevLightbox = () => setLightboxIndex((i) => Math.max(0, i - 1));
  const nextLightbox = () =>
    setLightboxIndex((i) => Math.min(lightboxImages.length - 1, i + 1));

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-button border-t-transparent shadow-soft"></div>
      </div>
    );
  }

  const renderTaskCard = (task) => {
    const images = [];
    if (task.imageUrl) images.push(task.imageUrl);
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach((a) => {
        if (a.url && !images.includes(a.url)) images.push(a.url);
      });
    }

    return (
      <div key={task._id} className="card-elegant p-6 group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(task.status)}`}>
              {String(task.status || "open").replace("-", " ")}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            <Calendar className="w-3 h-3 inline mr-1" />
            {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}
          </div>
        </div>

        <h3 className="font-bold text-lg text-primary-dark group-hover:text-primary-button transition-colors mb-2">{task.title}</h3>
        <p
          className="text-gray-700 text-sm leading-relaxed"
          style={
            expandedTasks[task._id]
              ? {}
              : {
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }
          }
        >
          {task.description}
        </p>

        {images.length > 0 && (
          <div className={`mt-3 ${expandedTasks[task._id] ? "mb-3" : "mb-0"}`}>
            <img
              src={images[0]}
              alt={task.title}
              role="button"
              onClick={() => openLightbox(images, 0)}
              className={`w-full cursor-pointer ${
                expandedTasks[task._id] ? "max-h-64 object-cover" : "max-h-28 object-cover rounded-md"
              } rounded-md border border-gray-100`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/vite.svg";
              }}
            />
          </div>
        )}

        {task.description && (
          <button
            type="button"
            onClick={() => toggleExpand(task._id)}
            className="text-sm text-primary-button mt-2"
            aria-expanded={!!expandedTasks[task._id]}
          >
            {expandedTasks[task._id] ? "Show less" : "Read more"}
          </button>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="badge-secondary text-xs">
            <Briefcase className="w-3 h-3 mr-1" />
            {task.category}
          </span>
          {task.skills?.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="badge-secondary text-xs">
              <Star className="w-3 h-3 mr-1" />
              {typeof skill === "string" ? skill : skill?.name || ""}
            </span>
          ))}
        </div>

        <div className="text-sm text-gray-700 mb-2">
          Assigned to: <span className="font-semibold">
            {task.assignedStudent 
              ? `${task.assignedStudent.firstName || ""} ${task.assignedStudent.lastName || ""}`.trim() || "Student"
              : "Unassigned"
            }
          </span>
        </div>

        {task.submissions && task.submissions.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
              <Users className="w-4 h-4" />
              <span>
                Submissions: <span className="font-semibold">{task.submissions.length}</span>
              </span>
            </div>
            {task.submissions.map((submission, index) => {
              let studentName = "Unknown Student";
              if (submission.student) {
                const st = submission.student;
                studentName =
                  (st.firstName ||
                    st.username ||
                    st.email?.split("@")[0]) +
                  (st.lastName ? ` ${st.lastName}` : "");
              }
              return (
                <div
                  key={index}
                  className="bg-primary-card rounded-lg p-3 text-xs border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary-dark">
                      {studentName}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      submission.status === "approved"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : submission.status === "rejected"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : submission.status === "under-review"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }`}>
                      {submission.status || "pending"}
                    </span>
                  </div>
                  {submission.link && (
                    <div className="mt-2">
                      <a
                        href={submission.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-button hover:text-primary-dark text-xs font-medium"
                      >
                        {submission.link}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Startup Tasks - Admin</title>
      </Helmet>

      <div className="min-h-screen bg-primary-white">
        <div className="container-responsive section-padding">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary-dark">
              {startup?.companyName || startup?.firstName || "Startup"} — Tasks
            </h1>
            <p className="text-gray-600">Read-only view of posted tasks and submissions</p>
          </div>

          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-primary-button rounded-full"></div>
                <h2 className="text-xl font-semibold text-primary-dark">Posted Tasks</h2>
              </div>
              {allTasks.length === 0 ? (
                <div className="text-center py-8 card-elegant text-gray-700">No tasks posted</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allTasks.map((t) => renderTaskCard(t))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <div className="bg-white rounded-md overflow-hidden">
              <div className="p-2 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {lightboxIndex + 1} / {lightboxImages.length}
                </div>
                <div className="flex gap-2">
                  <button onClick={prevLightbox} className="btn-ghost">
                    Prev
                  </button>
                  <button onClick={nextLightbox} className="btn-ghost">
                    Next
                  </button>
                  <button onClick={closeLightbox} className="btn-ghost">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-black">
                <img
                  src={lightboxImages[lightboxIndex]}
                  alt={`img-${lightboxIndex}`}
                  className="w-full max-h-[70vh] object-contain bg-black"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/vite.svg";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminStartupTasks;
