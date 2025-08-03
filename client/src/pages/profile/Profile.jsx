import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchStudentProfile, updateStudentProfile } from "../routes/profile";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const Profile = () => {
  const { authData } = useAuth();
  const token = authData?.token;
  const queryClient = useQueryClient();

  // Fetch profile
  const { data, isLoading } = useQuery(
    ["student-profile"],
    () => fetchStudentProfile(token),
    { enabled: !!token }
  );
  const student = data?.student || {};
  const badges = data?.student?.badges || [];
  const certificates = data?.student?.certificates || [];

  // Editable state
  const [form, setForm] = useState({
    bio: student.bio || "",
    projects: student.projects || [],
    experience: student.experience || [],
    skills: student.skills || [],
  });
  // For adding new project/exp/skill
  const [newProject, setNewProject] = useState({
    title: "",
    link: "",
    description: "",
    technologies: "",
  });
  const [newExp, setNewExp] = useState({
    title: "",
    company: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [newSkill, setNewSkill] = useState({ name: "", level: "beginner" });

  // Update mutation
  const updateMutation = useMutation((data) => updateStudentProfile(data), {
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries(["student-profile"]);
    },
    onError: (err) => toast.error(err.message || "Update failed"),
  });

  // Handlers
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleProjectAdd = () => {
    setForm({
      ...form,
      projects: [
        ...form.projects,
        { ...newProject, technologies: newProject.technologies.split(",") },
      ],
    });
    setNewProject({ title: "", link: "", description: "", technologies: "" });
  };
  const handleExpAdd = () => {
    setForm({ ...form, experience: [...form.experience, newExp] });
    setNewExp({
      title: "",
      company: "",
      description: "",
      startDate: "",
      endDate: "",
    });
  };
  const handleSkillAdd = () => {
    setForm({ ...form, skills: [...form.skills, newSkill] });
    setNewSkill({ name: "", level: "beginner" });
  };
  const handleProjectRemove = (idx) =>
    setForm({ ...form, projects: form.projects.filter((_, i) => i !== idx) });
  const handleExpRemove = (idx) =>
    setForm({
      ...form,
      experience: form.experience.filter((_, i) => i !== idx),
    });
  const handleSkillRemove = (idx) =>
    setForm({ ...form, skills: form.skills.filter((_, i) => i !== idx) });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bio */}
        <div>
          <label className="block font-semibold mb-1">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="textarea textarea-bordered w-full"
          />
        </div>

        {/* Projects */}
        <div>
          <label className="block font-semibold mb-1">Projects</label>
          <ul className="mb-2">
            {form.projects.map((proj, idx) => (
              <li key={idx} className="mb-1 flex items-center gap-2">
                <span className="font-medium">{proj.title}</span>
                <a
                  href={proj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {proj.link}
                </a>
                <span className="text-xs text-gray-500">
                  {proj.technologies?.join(", ")}
                </span>
                <button
                  type="button"
                  onClick={() => handleProjectRemove(idx)}
                  className="text-red-500 ml-2"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Title"
              value={newProject.title}
              onChange={(e) =>
                setNewProject({ ...newProject, title: e.target.value })
              }
              className="input input-bordered"
            />
            <input
              type="url"
              placeholder="Link"
              value={newProject.link}
              onChange={(e) =>
                setNewProject({ ...newProject, link: e.target.value })
              }
              className="input input-bordered"
            />
            <input
              type="text"
              placeholder="Tech (comma separated)"
              value={newProject.technologies}
              onChange={(e) =>
                setNewProject({ ...newProject, technologies: e.target.value })
              }
              className="input input-bordered"
            />
          </div>
          <textarea
            placeholder="Description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            className="textarea textarea-bordered w-full mb-2"
          />
          <button
            type="button"
            onClick={handleProjectAdd}
            className="btn btn-sm btn-primary"
          >
            Add Project
          </button>
        </div>

        {/* Work Experience */}
        <div>
          <label className="block font-semibold mb-1">Work Experience</label>
          <ul className="mb-2">
            {form.experience.map((exp, idx) => (
              <li key={idx} className="mb-1 flex items-center gap-2">
                <span className="font-medium">
                  {exp.title} at {exp.company}
                </span>
                <span className="text-xs text-gray-500">
                  {exp.startDate} - {exp.endDate || "Present"}
                </span>
                <button
                  type="button"
                  onClick={() => handleExpRemove(idx)}
                  className="text-red-500 ml-2"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Title"
              value={newExp.title}
              onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
              className="input input-bordered"
            />
            <input
              type="text"
              placeholder="Company"
              value={newExp.company}
              onChange={(e) =>
                setNewExp({ ...newExp, company: e.target.value })
              }
              className="input input-bordered"
            />
          </div>
          <input
            type="text"
            placeholder="Description"
            value={newExp.description}
            onChange={(e) =>
              setNewExp({ ...newExp, description: e.target.value })
            }
            className="input input-bordered w-full mb-2"
          />
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              placeholder="Start Date"
              value={newExp.startDate}
              onChange={(e) =>
                setNewExp({ ...newExp, startDate: e.target.value })
              }
              className="input input-bordered"
            />
            <input
              type="date"
              placeholder="End Date"
              value={newExp.endDate}
              onChange={(e) =>
                setNewExp({ ...newExp, endDate: e.target.value })
              }
              className="input input-bordered"
            />
          </div>
          <button
            type="button"
            onClick={handleExpAdd}
            className="btn btn-sm btn-primary"
          >
            Add Experience
          </button>
        </div>

        {/* Skills */}
        <div>
          <label className="block font-semibold mb-1">Skills</label>
          <ul className="mb-2">
            {form.skills.map((skill, idx) => (
              <li key={idx} className="mb-1 flex items-center gap-2">
                <span className="font-medium">{skill.name}</span>
                <span className="text-xs text-gray-500">{skill.level}</span>
                <button
                  type="button"
                  onClick={() => handleSkillRemove(idx)}
                  className="text-red-500 ml-2"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Skill Name"
              value={newSkill.name}
              onChange={(e) =>
                setNewSkill({ ...newSkill, name: e.target.value })
              }
              className="input input-bordered"
            />
            <select
              value={newSkill.level}
              onChange={(e) =>
                setNewSkill({ ...newSkill, level: e.target.value })
              }
              className="select select-bordered"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <button
              type="button"
              onClick={handleSkillAdd}
              className="btn btn-sm btn-primary"
            >
              Add Skill
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          Save Profile
        </button>
      </form>

      {/* Badges and Certificates */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Badges</h3>
        <div className="flex gap-2 flex-wrap">
          {badges.length === 0 && (
            <span className="text-gray-400">No badges yet.</span>
          )}
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
            >
              {badge.name}
            </span>
          ))}
        </div>
        <h3 className="text-lg font-semibold mt-6 mb-2">Certificates</h3>
        <div className="flex gap-2 flex-wrap">
          {certificates.length === 0 && (
            <span className="text-gray-400">No certificates yet.</span>
          )}
          {certificates.map((cert, idx) => (
            <a
              key={idx}
              href={cert.certificateUrl || cert.pdfUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-100 text-green-800 px-3 py-1 rounded-full underline"
            >
              {cert.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
