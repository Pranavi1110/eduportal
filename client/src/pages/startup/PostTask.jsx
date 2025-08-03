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
      const res = await api.get("/startup/students", {
        params: { skills: form.skills },
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
              {students.map((s) => (
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
                  <span className="font-semibold">
                    {s.firstName} {s.lastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    Skills: {s.skills?.map((sk) => sk.name).join(", ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block font-medium">Difficulty</label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
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
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block font-medium">Budget Min</label>
            <input
              name="budgetMin"
              type="number"
              value={form.budgetMin}
              onChange={handleChange}
              className="input-field"
              required
              min="0"
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium">Budget Max</label>
            <input
              name="budgetMax"
              type="number"
              value={form.budgetMax}
              onChange={handleChange}
              className="input-field"
              required
              min="0"
            />
          </div>
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
        <div>
          <label className="block font-medium">Priority</label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="input-field"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Posting..." : "Post Task"}
        </button>
      </form>
    </div>
  );
};

export default PostTask;
