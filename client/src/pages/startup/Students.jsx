import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Users, Briefcase, Mail, Filter } from "lucide-react";
import Avatar from "../../components/common/Avatar";
import api from "../../services/api";

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [skillsFilter, setSkillsFilter] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (skillsFilter.trim()) params.skills = skillsFilter.trim();
      const res = await api.get("/startup/students", { params });
      setStudents(res.data || []);
    } catch (e) {
      setStudents([]);
      console.error("Failed to fetch students", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter((s) => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const email = (s.email || "").toLowerCase();
      const skillsText = (s.skills || [])
        .map((sk) => sk?.name || "")
        .join(" ")
        .toLowerCase();
      return name.includes(q) || email.includes(q) || skillsText.includes(q);
    });
  }, [students, query]);

  return (
    <div className="min-h-screen bg-primary-white">
      <div className="gradient-bg-elegant text-primary-cta">
        <div className="container-responsive py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-garamond font-bold flex items-center gap-3">
                <Users className="w-7 h-7 text-primary-cta" />
                Students
              </h1>
              <p className="text-gray-200 mt-1">
                Discover and review student profiles
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="container-responsive section-padding">
        {/* Top filters */}
        <div className="card-elegant mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                className="input-field-elegant pl-9"
                placeholder="Search by name, email, or skill"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="relative flex-1 w-full md:w-auto">
              <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                className="input-field-elegant pl-9"
                placeholder="Filter by skills (comma separated)"
                value={skillsFilter}
                onChange={(e) => setSkillsFilter(e.target.value)}
              />
            </div>

            <div className="flex-shrink-0">
              <button onClick={fetchStudents} className="btn-primary">
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Students grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-button border-t-transparent mx-auto mb-3"></div>
            <div className="text-gray-700">Loading students...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-elegant text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-700">
              No students match your criteria.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filtered.map((s) => {
              const displayName =
                `${s.firstName || ""} ${s.lastName || ""}`.trim() ||
                s.username ||
                s.email?.split("@")[0] ||
                "Student";
              const topSkills = (s.skills || []).slice(0, 4);
              const projectsCount = (s.projects || []).length || 0;
              const avatarSrc = s.profilePicture || s.avatar || s.image || "";
              const headline = s.headline || s.summary || s.bio || "";

              return (
                <div
                  key={s._id}
                  className="border border-gray-200 rounded-2xl bg-primary-white p-6 hover:shadow-soft transition-shadow flex flex-col"
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={avatarSrc}
                      name={displayName}
                      sizeClass="w-16 h-16"
                      className="rounded-full shadow-soft"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-primary-dark truncate">
                        {displayName}
                      </div>
                      {headline && (
                        <div className="text-sm text-gray-600 truncate mt-1">
                          {headline}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex-1">
                    <div className="flex flex-wrap gap-3">
                      {topSkills.length === 0 ? (
                        <span className="badge-secondary text-sm">
                          No skills added
                        </span>
                      ) : (
                        topSkills.map((sk, idx) => (
                          <span key={idx} className="badge-secondary text-sm">
                            {sk?.name || sk}
                          </span>
                        ))
                      )}
                    </div>
                    
                    {/* Experience Summary */}
                    {s.experience && s.experience.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Recent Experience:</div>
                        <div className="text-sm text-gray-700">
                          {s.experience.slice(0, 1).map((exp, idx) => (
                            <div key={idx} className="truncate">
                              {exp.title} at {exp.company}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-primary-button" />
                      <span>{projectsCount} projects</span>
                      {s.experience && s.experience.length > 0 && (
                        <span className="text-gray-500">• {s.experience.length} exp</span>
                      )}
                      {s.resume && s.resume.trim() !== "" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Resume
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/startup/students/${s._id}`}
                        className="btn-ghost text-sm px-3 py-1"
                      >
                        View
                      </Link>
                      {s.resume && s.resume.trim() !== "" && (
                        <a
                          href={s.resume.startsWith('http') ? s.resume : `https://hubinity.onrender.com${s.resume}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          Resume
                        </a>
                      )}
                      <Link
                        to={`/chat/${s._id}`}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Message
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Students;
