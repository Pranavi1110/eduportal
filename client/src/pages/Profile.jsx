import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  fetchStudentProfile,
  updateStudentProfile,
  createStudentProfile,
} from "../routes/profile";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Detect startup user
  const isStartup = user?.userType === "startup";
  const userId = user?._id || user?.id;
  const auth = JSON.parse(localStorage.getItem("auth"));
  const token = user?.token || auth?.token;
  // Fetch profile for this userId
  console.log("JWT token being sent:", token);
  const { data, isLoading } = useQuery(
    ["student-profile", token],
    () => fetchStudentProfile(token),
    { enabled: !!token }
  );

  // Editable state
  const [form, setForm] = useState(null);
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

  // Sync form state with fetched student data
  useEffect(() => {
    if (data?.user) {
      setForm({
        bio: data.user.bio || "",
        projects: data.user.projects || [],
        experience: data.user.experience || [],
        skills: data.user.skills || [],
        college: data.user.college || "",
        collegeEmail: data.user.collegeEmail || "",
        profilePicture: data.user.profilePicture || "",
        resume: data.user.resume || "",
        // completedTasks, totalEarnings, rating removed
      });
    } else if (data && !data.user) {
      setForm({
        bio: "",
        projects: [],
        experience: [],
        skills: [],
        college: "",
        collegeEmail: "",
        profilePicture: "",
        resume: "",
        // completedTasks, totalEarnings, rating removed
      });
    }
  }, [data]);

  // Add mutation
  const addMutation = useMutation(
    (data) => {
      // Map collegeEmail to email for backend compatibility
      const payload = { ...data, userId, email: data.collegeEmail };
      return createStudentProfile(payload);
    },
    {
      onSuccess: () => {
        toast.success("Profile created!");
        queryClient.invalidateQueries(["student-profile", userId]);
        navigate("/student/dashboard");
      },
      onError: (err) => {
        const msg =
          err?.response?.data?.error ||
          err.message ||
          "Failed to create profile";
        toast.error(msg);
      },
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (data) => updateStudentProfile(userId, data),
    {
      onSuccess: () => {
        toast.success("Profile updated!");
        queryClient.invalidateQueries(["student-profile", userId]);
        navigate("/student/dashboard");
      },
      onError: (err) => {
        const msg =
          err?.response?.data?.error || err.message || "Update failed";
        toast.error(msg);
      },
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
    // Filter out incomplete skills, experience, and projects
    const filteredForm = {
      ...form,
      skills: (form.skills || []).filter((s) => s && s.name && s.name.trim()),
      experience: (form.experience || []).filter(
        (exp) => exp && exp.title && exp.company
      ),
      projects: (form.projects || []).filter((proj) => proj && proj.title),
    };
    if (data?.user) {
      updateMutation.mutate(filteredForm);
    } else {
      addMutation.mutate(filteredForm);
    }
  };

  if (isLoading || form === null) {
    return <div className="p-8 text-gray-500">Loading profile...</div>;
  }

  if (isStartup) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
        <h2 className="text-2xl font-bold mb-4">Startup Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile picture upload for startup */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Profile picture</label>
            <div className="flex items-center gap-4">
              <img
                src={
                  form?.profilePicture || user?.profilePicture || "/vite.svg"
                }
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover border"
                onError={(e) => (e.target.src = "/vite.svg")}
              />
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () =>
                      setForm((f) => ({ ...f, profilePicture: reader.result }));
                    reader.readAsDataURL(file);

                    try {
                      const formData = new FormData();
                      formData.append("avatar", file);
                      const res = await fetch("/api/uploads/avatar", {
                        method: "POST",
                        body: formData,
                      });
                      const json = await res.json();
                      if (res.ok && json.url)
                        setForm((f) => ({ ...f, profilePicture: json.url }));
                      else throw new Error(json.error || "Upload failed");
                    } catch (err) {
                      console.error("Upload error", err);
                      alert("Failed to upload image");
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Upload a square image for best results. File will be stored on
                  the server.
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={form?.companyName || user.companyName || ""}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              className="input input-bordered w-full bg-gray-100 focus:bg-white p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Company Email</label>
            <input
              type="email"
              name="email"
              value={form?.email || user.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input input-bordered w-full bg-gray-100 focus:bg-white p-2"
            />
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Skills Required</label>
            <ul className="mb-2">
              {(form?.skills?.length === 0 || !form?.skills) && (
                <li>
                  <span className="text-gray-400">No skills listed.</span>
                </li>
              )}
              {form?.skills?.map((skill, idx) => (
                <li key={idx} className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{skill.name || skill}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        skills: form.skills.filter((_, i) => i !== idx),
                      })
                    }
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
                className="input input-bordered p-2"
              />
              <select
                value={newSkill.level}
                onChange={(e) =>
                  setNewSkill({ ...newSkill, level: e.target.value })
                }
                className="select select-bordered bg-gray-100 focus:bg-white p-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (newSkill.name.trim()) {
                    setForm({
                      ...form,
                      skills: [...(form?.skills || []), newSkill],
                    });
                    setNewSkill({ name: "", level: "beginner" });
                  }
                }}
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
      </div>
    );
  }

  // Student profile UI (unchanged)
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">
        {data && data.user == null ? "Add Profile" : "Edit Profile"}
      </h2>
      {/* Profile picture upload */}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Profile picture</label>
        <div className="flex items-center gap-4">
          <img
            src={form.profilePicture || user?.profilePicture || "/vite.svg"}
            alt="Preview"
            className="w-16 h-16 rounded-full object-cover border"
            onError={(e) => (e.target.src = "/vite.svg")}
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
                  console.error("Upload error", err);
                  alert("Failed to upload image");
                }
              }}
              className=""
            />
            <div className="text-xs text-gray-500 mt-1">
              Upload a square image for best results. File will be stored on the
              server.
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resume Upload */}
        <div>
          <label className="block font-semibold mb-1">Resume</label>
          <div className="flex items-center gap-4">
            {form.resume ? (
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-green-600">Resume uploaded</div>
                  <a 
                    href={form.resume} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View current resume
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No resume uploaded</div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                name="resume"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  
                  // Validate file type
                  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                  if (!allowedTypes.includes(file.type)) {
                    alert('Please upload a PDF or Word document');
                    return;
                  }
                  
                  // Validate file size (5MB limit)
                  if (file.size > 5 * 1024 * 1024) {
                    alert('File size must be less than 5MB');
                    return;
                  }

                  try {
                    const formData = new FormData();
                    formData.append("resume", file);
                    const res = await fetch("/api/uploads/resume", {
                      method: "POST",
                      body: formData,
                    });
                    const json = await res.json();
                    if (res.ok && json.url) {
                      setForm((f) => ({ ...f, resume: json.url }));
                    } else {
                      throw new Error(json.error || "Upload failed");
                    }
                  } catch (err) {
                    console.error("Upload error", err);
                    alert("Failed to upload resume");
                  }
                }}
                className=""
              />
              <div className="text-xs text-gray-500 mt-1">
                Upload PDF or Word document (max 5MB)
              </div>
            </div>
          </div>
        </div>
        {/* College */}
        <div>
          <label className="block font-semibold mb-1">College</label>
          <input
            type="text"
            name="college"
            value={form.college}
            onChange={handleChange}
            className="input input-bordered w-full bg-gray-100 focus:bg-white p-2"
          />
        </div>
        {/* College Email */}
        <div>
          <label className="block font-semibold mb-1">College Email</label>
          <input
            type="email"
            name="collegeEmail"
            value={form.collegeEmail}
            onChange={handleChange}
            className="input input-bordered w-full bg-gray-100 focus:bg-white p-2"
          />
        </div>
        {/* Bio */}
        <div>
          <label className="block font-semibold mb-1">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="textarea textarea-bordered w-full bg-gray-100 focus:bg-white p-2"
          />
        </div>
        {/* Projects */}
        <div>
          <label className="block font-semibold mb-1">Projects</label>
          <ul className="mb-2">
            {form.projects.map((proj, idx) => (
              <li key={idx} className="mb-1 flex items-center gap-2">
                <span className="font-medium p-2">{proj.title}</span>
                <a
                  href={proj.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline p-2"
                >
                  {proj.link}
                </a>
                <span className="text-xs text-gray-500">
                  {Array.isArray(proj.technologies)
                    ? proj.technologies.join(", ")
                    : proj.technologies}
                </span>
                <button
                  type="button"
                  onClick={() => handleProjectRemove(idx)}
                  className="text-red-500 ml-2 "
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
              className="input input-bordered p-2"
            />
            <input
              type="url"
              placeholder="Link"
              value={newProject.link}
              onChange={(e) =>
                setNewProject({ ...newProject, link: e.target.value })
              }
              className="input input-bordered p-2 bg-gray-100 focus:bg-white"
            />
            <input
              type="text"
              placeholder="Tech (comma separated)"
              value={newProject.technologies}
              onChange={(e) =>
                setNewProject({ ...newProject, technologies: e.target.value })
              }
              className="input input-bordered p-2 bg-gray-100 focus:bg-white"
            />
          </div>
          <textarea
            placeholder="Description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            className="textarea  p-2 textarea-bordered w-full mb-2 bg-gray-100 focus:bg-white"
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
              className="input input-bordered p-2 bg-gray-100 focus:bg-white"
            />
          </div>
          <input
            type="text"
            placeholder="Description"
            value={newExp.description}
            onChange={(e) =>
              setNewExp({ ...newExp, description: e.target.value })
            }
            className="input input-bordered  p-2 w-full mb-2 bg-gray-100 focus:bg-white"
          />
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              placeholder="Start Date"
              value={newExp.startDate}
              onChange={(e) =>
                setNewExp({ ...newExp, startDate: e.target.value })
              }
              className="input  p-2 input-bordered bg-gray-100 focus:bg-white"
            />
            <input
              type="date"
              placeholder="End Date"
              value={newExp.endDate}
              onChange={(e) =>
                setNewExp({ ...newExp, endDate: e.target.value })
              }
              className="input input-bordered bg-gray-100 focus:bg-white"
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
              className="input input-bordered p-2"
            />
            <select
              value={newSkill.level}
              onChange={(e) =>
                setNewSkill({ ...newSkill, level: e.target.value })
              }
              className="select select-bordered bg-gray-100 focus:bg-white p-2"
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
    </div>
  );
};

export default Profile;
