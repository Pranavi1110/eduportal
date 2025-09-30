import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import Avatar from "../../components/common/Avatar";

const StartupProfile = () => {
  const { user } = useAuth();
  const { startupId } = useParams();
  const location = useLocation();
  const isAdminView = location.pathname.includes('/admin/');
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [startupId, isAdminView]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (isAdminView && startupId) {
        // Admin viewing specific startup
        const res = await api.get(`/users/${startupId}`);
        setProfile(res.data);
        setForm(res.data);
      } else {
        // Regular startup user viewing own profile
        const res = await api.get("/startup/dashboard");
        setProfile(res.data.startup);
        setForm(res.data.startup);
      }
    } catch (err) {
      toast.error("Failed to load profile");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/startup/profile", form);
      toast.success("Profile updated");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      toast.error("Update failed");
    }
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Startup Profile</h2>
      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Profile picture</label>
            <div className="flex items-center gap-4">
              <Avatar
                src={form.profilePicture || profile.profilePicture}
                name={form.companyName || profile.companyName || "Company"}
                sizeClass="w-16 h-16"
                className="rounded-full"
              />
              <div>
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
                      toast.error("Failed to upload image");
                    }
                  }}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Upload a square image for best results.
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block font-medium">Company Name</label>
            <input
              name="companyName"
              value={form.companyName || ""}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Industry</label>
            <input
              name="industry"
              value={form.industry || ""}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Company Description</label>
            <textarea
              name="companyDescription"
              value={form.companyDescription || ""}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block font-medium">Company Size</label>
            <input
              name="companySize"
              value={form.companySize || ""}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary">
            Save
          </button>
          <button
            type="button"
            className="btn-secondary ml-2"
            onClick={() => setEditMode(false)}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Avatar
              src={profile.profilePicture || profile.companyLogo}
              name={profile.companyName}
              sizeClass="w-20 h-20"
              className="rounded-full"
            />
            <div>
              <div className="text-xl font-semibold">{profile.companyName}</div>
              <div className="text-sm text-gray-600">{profile.email}</div>
            </div>
          </div>
          <div className="mb-2">
            <b>Company Name:</b> {profile.companyName}
          </div>
          {!isAdminView && (
            <>
              <div className="mb-2">
                <b>Industry:</b> {profile.industry}
              </div>
              <div className="mb-2">
                <b>Description:</b> {profile.companyDescription}
              </div>
              <div className="mb-2">
                <b>Company Size:</b> {profile.companySize}
              </div>
            </>
          )}
          {!isAdminView && (
            <button
              className="btn-primary mt-4"
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StartupProfile;
