import React, { useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const categories = [
  "development",
  "design",
  "marketing",
  "research",
  "writing",
  "data-analysis",
  "other",
];
const difficulties = ["beginner", "intermediate", "advanced", "expert"];
const priorities = ["low", "medium", "high", "urgent"];

const PostTask = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
      toast.success("Task posted!");
      setForm({
        title: "",
        description: "",
        category: "",
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
      toast.error("Failed to post task");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Post New Task</h2>
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
          <label className="block font-medium">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
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
          <div className="border rounded p-4 bg-gray-50">
            <label className="block font-medium mb-2">
              Select Student to Assign
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {students
                .filter(
                  (s) =>
                    s.userType === "student" &&
                    (s.firstName || s.lastName || s.username || s.name)
                )
                .map((s) => (
                  <label
                    key={s._id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="selectedStudent"
                      value={s._id}
                      checked={selectedStudent === s._id}
                      onChange={() => setSelectedStudent(s._id)}
                      required
                    />
                    <span className="font-semibold text-blue-700">
                      {[s.firstName, s.lastName].filter(Boolean).join(" ") ||
                        s.username ||
                        s.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Username:{" "}
                      <span className="text-gray-700 font-bold">
                        {s.username ||
                          s.name ||
                          [s.firstName, s.lastName].filter(Boolean).join(" ")}
                      </span>
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
          {loading ? "Posting..." : "Post Task"}
        </button>
      </form>
    </div>
  );
};

export default PostTask;