import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const BrowseStudents = () => {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    skills: "",
    workExp: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.skills) params.skills = filters.skills;
      // TODO: Add workExp filter
      const res = await api.get("/startup/students", { params });
      setStudents(res.data);
    } catch {
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Browse Students</h2>
      <form onSubmit={handleFilter} className="flex gap-4 mb-6">
        <input
          name="skills"
          value={filters.skills}
          onChange={handleFilterChange}
          className="input-field"
          placeholder="Skills (comma separated)"
        />
        {/* badges filter removed */}
        {/* <input name="workExp" value={filters.workExp} onChange={handleFilterChange} className="input-field" placeholder="Work Experience (years)" /> */}
        <button type="submit" className="btn-primary">
          Filter
        </button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((s) => {
            const displayName = `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email?.split("@")[0] || "Student";
            const topSkills = (s.skills || []).slice(0, 4);
            const experienceCount = (s.experience || []).length;
            const projectsCount = (s.projects || []).length;
            const hasResume = s.resume && s.resume.trim() !== "";
            
            return (
              <div key={s._id} className="p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-bold text-lg text-primary-dark mb-1">
                      {displayName}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {s.email}
                    </div>
                    {s.bio && (
                      <div className="text-sm text-gray-700 line-clamp-2 mb-3">
                        {s.bio}
                      </div>
                    )}
                  </div>
                  {hasResume && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Resume Available
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Skills:</div>
                    <div className="flex flex-wrap gap-1">
                      {topSkills.length === 0 ? (
                        <span className="text-xs text-gray-500">No skills added</span>
                      ) : (
                        topSkills.map((sk, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {sk?.name || sk}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span>{experienceCount} experience{experienceCount !== 1 ? 's' : ''}</span>
                      <span>{projectsCount} project{projectsCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/startup/students/${s._id}`}
                        className="text-primary-button hover:text-primary-dark text-sm font-medium"
                      >
                        View Profile
                      </Link>
                      {hasResume && (
                        <a
                          href={s.resume.startsWith('http') ? s.resume : `https://hubinity.onrender.com${s.resume}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          View Resume
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseStudents;
