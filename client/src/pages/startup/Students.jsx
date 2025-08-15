import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Users, Briefcase, Mail, ArrowRight, Filter, Badge } from "lucide-react";
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
              <p className="text-gray-200 mt-1">Discover and review student profiles and their past submissions</p>
            </div>
          </div>
        </div>
      </div>

      <section className="container-responsive section-padding">
        <div className="card-elegant mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                className="input-field-elegant pl-9"
                placeholder="Search by name, email, or skill"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="relative md:col-span-2">
              <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                className="input-field-elegant pl-9"
                placeholder="Filter by skills (comma separated)"
                value={skillsFilter}
                onChange={(e) => setSkillsFilter(e.target.value)}
              />
              <div className="mt-3">
                <button onClick={fetchStudents} className="btn-primary">Apply Filters</button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-button border-t-transparent mx-auto mb-3"></div>
            <div className="text-gray-700">Loading students...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-elegant text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-700">No students match your criteria.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => {
              const displayName = `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.username || s.email?.split("@")[0] || "Student";
              const initial = displayName.charAt(0).toUpperCase();
              const topSkills = (s.skills || []).slice(0, 4);
              const projectsCount = (s.projects || []).length;
              return (
                <div key={s._id} className="border border-gray-200 rounded-2xl bg-primary-white p-6 hover:shadow-soft transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-button text-primary-dark flex items-center justify-center font-bold text-lg shadow-soft">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-primary-dark truncate">{displayName}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5" /> {s.email}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {topSkills.length === 0 ? (
                      <span className="badge-secondary text-xs">No skills added</span>
                    ) : (
                      topSkills.map((sk, idx) => (
                        <span key={idx} className="badge-secondary text-xs">{sk?.name || sk}</span>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary-button" />
                      <span>{projectsCount} projects</span>
                    </div>
                    <Link to={`/startup/students/${s._id}`} className="text-primary-button hover:text-primary-dark font-medium flex items-center gap-1">
                      View Profile <ArrowRight className="w-4 h-4" />
                    </Link>
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


