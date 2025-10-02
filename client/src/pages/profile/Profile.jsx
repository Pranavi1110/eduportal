import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { fetchStudentProfile, updateStudentProfile } from "../routes/profile";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import Avatar from "../../components/common/Avatar";

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
  // server /dashboard returns { user, tasks }
  const student = data?.user || {};
  const badges = data?.user?.badges || [];
  const certificates = data?.user?.certificates || [];

  // Editable state
  const [form, setForm] = useState({
    profilePicture: student.profilePicture || "",
    bio: student.bio || "",
    projects: student.projects || [],
    experience: student.experience || [],
    skills: student.skills || [],
  });

  // keep form in sync when student data loads
  useEffect(() => {
    setForm({
      profilePicture: student.profilePicture || "",
      bio: student.bio || "",
      projects: student.projects || [],
      experience: student.experience || [],
      skills: student.skills || [],
    });
    // Debug: log fetched student and form initialization
    // eslint-disable-next-line no-console
    console.log("[Profile] fetched data:", data);
    // eslint-disable-next-line no-console
    console.log("[Profile] student:", student);
    // eslint-disable-next-line no-console
    console.log("[Profile] initialized form:", {
      profilePicture: student.profilePicture || "",
      bio: student.bio || "",
    });
  }, [student]);
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
  const updateMutation = useMutation(
    ({ userId, data }) => updateStudentProfile(userId, data),
    {
      onSuccess: () => {
        toast.success("Profile updated!");
        // Debug: log success
        // eslint-disable-next-line no-console
        console.log("[Profile] update success - invalidating queries");
        queryClient.invalidateQueries(["student-profile"]);
      },
      onError: (err) => toast.error(err.message || "Update failed"),
    }
  );

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
    // ensure we send userId + data shape expected by the client route
    updateMutation.mutate({ userId: student._id, data: form });
  };

  if (isLoading)
    return <div className="p-8 text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile picture upload */}
        <div>
          <label className="block font-semibold mb-1">Profile picture</label>
          <div className="flex items-center gap-4">
            <Avatar
              src={form.profilePicture || student.profilePicture}
              name={`${student.firstName || ""} ${student.lastName || ""}`}
              sizeClass="w-16 h-16"
              className="rounded-full"
            />
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                name="avatar"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  // show temporary preview
                  const reader = new FileReader();
                  reader.onload = () => {
                    setForm((f) => ({ ...f, profilePicture: reader.result }));
                  };
                  reader.readAsDataURL(file);

                  // upload to server
                  try {
                    const formData = new FormData();
                    formData.append("avatar", file);
                    const res = await fetch("/api/uploads/avatar", {
                      method: "POST",
                      body: formData,
                    });
                    const json = await res.json();
                    if (res.ok && json.url) {
                      setForm((f) => ({ ...f, profilePicture: json.url }));
                    } else {
                      throw new Error(json.error || "Upload failed");
                    }
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error("Upload error", err);
                    alert("Failed to upload image");
                  }
                }}
                className=""
              />
              <div className="text-xs text-gray-500 mt-1">
                Upload a square image for best results. File will be stored on
                the server.
              </div>
            </div>
          </div>
        </div>

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
        <div className="grid gap-3 md:grid-cols-2">
          {certificates.length === 0 && (
            <div className="col-span-2 text-center py-4 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-2xl mb-2">📜</div>
              <span className="text-gray-500">
                No certificates yet. Complete tasks to earn certificates!
              </span>
            </div>
          )}
          {certificates.map((cert, idx) => (
            <div
              key={idx}
              className="bg-green-50 border border-green-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-800 truncate">
                  {cert.metadata?.taskTitle || cert.title}
                </h4>
                <span className="text-xs text-green-600">
                  {new Date(cert.issuedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-green-700 mb-2">
                {cert.startup?.companyName || "Unknown Company"}
              </p>
              <div className="flex gap-2">
                <a
                  href={`/api/student/certificates/${cert._id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs hover:bg-green-200"
                >
                  📄 Download
                </a>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  #{cert.certificateNumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
