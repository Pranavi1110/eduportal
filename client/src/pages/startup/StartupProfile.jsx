import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const StartupProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("/startup/dashboard");
      setProfile(res.data.startup);
      setForm(res.data.startup);
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
          <div className="mb-2">
            <b>Company Name:</b> {profile.companyName}
          </div>
          <div className="mb-2">
            <b>Industry:</b> {profile.industry}
          </div>
          <div className="mb-2">
            <b>Description:</b> {profile.companyDescription}
          </div>
          <div className="mb-2">
            <b>Company Size:</b> {profile.companySize}
          </div>
          <button
            className="btn-primary mt-4"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default StartupProfile;
