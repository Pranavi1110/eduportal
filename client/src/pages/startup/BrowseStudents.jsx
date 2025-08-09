import React, { useEffect, useState } from "react";
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {students.map((s) => (
            <div key={s._id} className="p-4 border rounded">
              <div className="font-bold text-lg mb-1">
                {s.firstName} {s.lastName}
              </div>
              <div className="mb-1">
                <b>Skills:</b> {s.skills?.map((sk) => sk.name).join(", ")}
              </div>
              {/* <div className="mb-1">
                <b>Badges:</b> {s.badges?.map((b) => b.name).join(", ")}
              </div> */}
              {/* <div className="mb-1"><b>Work Exp:</b> {s.workExp} years</div> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseStudents;
