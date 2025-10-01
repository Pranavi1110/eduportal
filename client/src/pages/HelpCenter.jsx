import React, { useState } from "react";
import { submitHelpRequest } from "../routes/help";

const HelpCenter = () => {
  const [form, setForm] = useState({ phone: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validate = () => {
    if (!form.phone || !form.email) {
      setError("Both phone number and email are required.");
      return false;
    }
    // Simple email and phone validation
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const phoneRegex = /^\d{10,15}$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!phoneRegex.test(form.phone)) {
      setError("Please enter a valid phone number.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await submitHelpRequest(form);
      setSuccess("Thank you! We'll reach out to you at the earliest.");
      setForm({ phone: "", email: "" });
    } catch {
      setError("Failed to submit. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Help Center</h2>
        <p className="mb-4 text-gray-600 text-center">
          Enter your phone number and email ID. We'll reach out to you at the earliest.
        </p>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="Enter your phone number"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium">Email ID</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="Enter your email ID"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary-button text-white py-2 rounded hover:bg-primary-cta"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default HelpCenter;
