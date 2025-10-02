import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, Mail, Users, Briefcase, Award, Link2, Calendar, MessageSquare, FileText } from "lucide-react";
import api from "../../services/api";

const StudentProfile = () => {
  const { studentId } = useParams();
  const location = useLocation();
  const isAdminView = location.pathname.includes('/admin/');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);

  const fetchStudent = async () => {
    try {
      const res = await api.get(`/users/${studentId}`);
      setStudent(res.data);
    } catch (e) {
      setStudent(null);
    }
  };

  const fetchSubmissions = async () => {
    try {
      // Fetch all tasks across the platform and filter submissions for this student
      const res = await api.get("/student/tasks/all");
      const all = (res.data || []).flatMap((task) =>
        (task.submissions || [])
          .filter((s) => (typeof s.student === "object" ? s.student?._id === studentId : s.student === studentId))
          .map((s) => ({ ...s, task }))
      );
      setSubmissions(all);
    } catch (e) {
      setSubmissions([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStudent(), fetchSubmissions()]).finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [studentId]);

  const displayName = useMemo(() => {
    if (!student) return "";
    return `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.username || student.email?.split("@")[0] || "Student";
  }, [student]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-button border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-700">Loading student profile...</div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container-responsive section-padding">
        <div className="card-elegant text-center">
          <div className="text-gray-700">Student not found.</div>
          <div className="mt-4">
            <Link to="/startup/students" className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Students
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const skills = student.skills || [];
  const projects = student.projects || [];

  return (
    <div className="min-h-screen bg-primary-white">
      <div className="gradient-bg-elegant text-primary-cta">
        <div className="container-responsive py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-garamond font-bold">{displayName}</h1>
              <div className="text-gray-200 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {student.email}
              </div>
            </div>
            <div>
              <Link to="/startup/students" className="btn-ghost inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="container-responsive section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="card-elegant">
              <h2 className="text-2xl font-bold text-primary-dark mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-button" /> About
              </h2>
              <div className="text-gray-700 whitespace-pre-wrap">{student.bio || "No bio provided."}</div>
              {skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-primary-dark mb-3">Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skills.map((sk, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-primary-dark">
                            {sk?.name || sk}
                          </span>
                          {sk?.isVerified && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {sk?.level || 'beginner'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Experience Section */}
            {student.experience && student.experience.length > 0 && (
              <div className="card-elegant">
                <h2 className="text-2xl font-bold text-primary-dark mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary-button" /> Experience
                </h2>
                <div className="space-y-4">
                  {student.experience.map((exp, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-primary-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-primary-dark">{exp.title}</div>
                          <div className="text-sm text-primary-button font-medium">{exp.company}</div>
                          {exp.description && (
                            <div className="text-sm text-gray-700 mt-2">{exp.description}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          <div>
                            {new Date(exp.startDate).toLocaleDateString()} - 
                            {exp.isCurrent ? " Present" : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : " N/A"}
                          </div>
                          {exp.isCurrent && (
                            <div className="text-green-600 font-medium">Current</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-elegant">
              <h2 className="text-2xl font-bold text-primary-dark mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-button" /> Projects
              </h2>
              {projects.length === 0 ? (
                <div className="text-gray-700">No projects added.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((p, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-primary-white">
                      <div className="font-semibold text-primary-dark">{p.title}</div>
                      {p.description && <div className="text-sm text-gray-700 mt-1 line-clamp-3">{p.description}</div>}
                      <div className="flex items-center justify-between mt-3 text-sm">
                        <div className="text-gray-600 flex flex-wrap gap-1">
                          {(p.technologies || []).slice(0, 4).map((t, i) => (
                            <span key={i} className="badge-secondary text-[10px]">{t}</span>
                          ))}
                        </div>
                        {p.link && (
                          <a href={p.link} target="_blank" rel="noreferrer" className="text-primary-button hover:text-primary-dark inline-flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5" /> Visit
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resume Section */}
            {student.resume && (
              <div className="card-elegant">
                <h2 className="text-2xl font-bold text-primary-dark mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-button" /> Resume
                </h2>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary-button rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-primary-dark">Student Resume</div>
                    <div className="text-sm text-gray-600">Click to view or download</div>
                  </div>
                  <a
                    href={student.resume.startsWith('http') ? student.resume : `https://hubinity.onrender.com${student.resume}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    View Resume
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="card-elegant">
              <h2 className="text-2xl font-bold text-primary-dark mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary-button" /> Past Submissions
              </h2>
              {submissions.length === 0 ? (
                <div className="text-gray-700">No submissions found for your tasks.</div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((s, idx) => (
                    <div key={s._id || idx} className="border border-gray-200 rounded-xl p-4 bg-primary-white">
                      <div className="font-semibold text-primary-dark">{s.task?.title || "Task"}</div>
                      <div className="text-xs text-gray-700 mt-1">Startup: <span className="font-medium">{s.task?.startup?.companyName || s.task?.startup?.firstName || s.task?.startup?.email?.split("@")[0] || "Startup"}</span></div>
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : ""}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${
                          s.status === "approved"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : s.status === "rejected"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : s.status === "under-review"
                            ? "bg-orange-100 text-orange-800 border-orange-300"
                            : "bg-gray-100 text-gray-800 border-gray-300"
                        }`}>
                          {s.status || "pending"}
                        </span>
                      </div>
                      <div className="mt-3">
                        <a href={s.link} target="_blank" rel="noreferrer" className="text-primary-button hover:text-primary-dark inline-flex items-center gap-1 text-sm">
                          <Link2 className="w-3.5 h-3.5" /> View submission
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isAdminView && (
              <div className="card-elegant">
                <h2 className="text-2xl font-bold text-primary-dark mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-button" /> Contact
                </h2>
                <div className="text-sm text-gray-700">Reach out to the student directly.</div>
                <div className="mt-4">
                  <Link to={`/chat/${student._id}`} className="btn-primary">Start Chat</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentProfile;


