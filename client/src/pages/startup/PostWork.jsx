import React, { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const technicalCategories = [
  "development",
  "design",
  "data-analysis",
  "testing",
  "devops",
  "mobile-development",
  "web-development",
  "ai-ml",
  "cybersecurity",
  "database",
  "api-development",
  "cloud-computing",
];

const nonTechnicalCategories = [
  "marketing",
  "research",
  "writing",
  "content-creation",
  "social-media",
  "business-development",
  "sales",
  "customer-support",
  "project-management",
  "hr-recruitment",
  "finance-accounting",
  "legal",
  "operations",
  "event-management",
  "translation",
  "other",
];

const workTypes = [
  "technical",
  "non-technical"
];

const difficulties = ["beginner", "intermediate", "advanced", "expert"];
const priorities = ["low", "medium", "high", "urgent"];

const PostWork = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    workType: "",
    skills: "",
    difficulty: "",
    estimatedHours: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Reset category when work type changes
    if (name === "workType") {
      setForm(prev => ({ ...prev, [name]: value, category: "" }));
    }
  };

  // Get categories based on selected work type
  const getCategories = () => {
    if (form.workType === "technical") {
      return technicalCategories;
    } else if (form.workType === "non-technical") {
      return nonTechnicalCategories;
    }
    return [];
  };

  const handleFindStudents = async (e) => {
    e.preventDefault();
    setSearching(true);
    setStudents([]);
    setSelectedStudent("");
    try {
      // Fetch users from User model where userType is student and skills match
      const res = await api.get("/users", {
        params: { userType: "student", skills: form.skills },
      });
      setStudents(res.data);
    } catch {
      setStudents([]);
    }
    setSearching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()),
        budget: { min: Number(form.budgetMin), max: Number(form.budgetMax) },
        estimatedHours: Number(form.estimatedHours),
        deadline: form.deadline,
      };
      if (selectedStudent) {
        payload.assignedStudent = selectedStudent;
      }
      await api.post("/startup/tasks", payload);
      toast.success("Work posted!");
      setForm({
        title: "",
        description: "",
        category: "",
        workType: "",
        skills: "",
        difficulty: "",
        estimatedHours: "",
        budgetMin: "",
        budgetMax: "",
        deadline: "",
        priority: "medium",
      });
      setStudents([]);
      setSelectedStudent("");
    } catch (e) {
      toast.error("Failed to post work");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Post New Work</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Work Type</label>
          <select
            name="workType"
            value={form.workType}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select Work Type</option>
            {workTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="input-field"
            required
            disabled={!form.workType}
          >
            <option value="">
              {form.workType 
                ? `Select ${form.workType.charAt(0).toUpperCase() + form.workType.slice(1)} Category`
                : "Select Work Type First"
              }
            </option>
            {getCategories().map((c) => (
              <option key={c} value={c}>
                {c.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Skills (comma separated)</label>
          <div className="flex gap-2">
            <input
              name="skills"
              value={form.skills}
              onChange={handleChange}
              className="input-field flex-1"
              required
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={handleFindStudents}
              disabled={!form.skills || searching}
            >
              {searching ? "Searching..." : "Find Students"}
            </button>
          </div>
        </div>

        {students.length > 0 && (
          <div>
            <label className="block font-medium mb-2">
              Available Students ({students.length})
            </label>
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
              {students.map((s) => (
                <label key={s._id} className="flex items-start space-x-2">
                  <input
                    type="radio"
                    name="selectedStudent"
                    value={s._id}
                    checked={selectedStudent === s._id}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="mt-1"
                  />
                  <span className="flex-1">
                    <span className="font-medium">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      Skills:{" "}
                      {Array.isArray(s.skills) && s.skills.length > 0 ? (
                        s.skills
                          .flatMap((sk) =>
                            sk.name
                              ? sk.name.split(",").map((skill) => skill.trim())
                              : []
                          )
                          .map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-1"
                            >
                              {skill}
                            </span>
                          ))
                      ) : (
                        <span className="text-gray-400">No skills listed</span>
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block font-medium">Estimated Hours</label>
          <input
            name="estimatedHours"
            type="number"
            value={form.estimatedHours}
            onChange={handleChange}
            className="input-field"
            required
            min="1"
          />
        </div>
        <div>
          <label className="block font-medium">Deadline</label>
          <input
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Posting..." : "Post Work"}
        </button>
      </form>
    </div>
  );
};

export default PostWork;
