import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { Mail, ArrowRight } from "lucide-react";
import api from "../../services/api";

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/forgot-password", { email: data.email });
      setMessage(
        res.data.message ||
          "If an account with that email exists, a reset email has been sent."
      );
    } catch (err) {
      console.error("Forgot password error", err);
      setMessage("An error occurred. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - Hubinity</title>
        <meta name="description" content="Reset your password" />
      </Helmet>

      <div className="min-h-screen bg-primary-card flex flex-col justify-center section-padding-sm">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-garamond font-bold text-primary-dark">
              Forgot password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we'll send a temporary password to reset your
              account.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card-elegant py-8 px-4 sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register("email", { required: "Email is required" })}
                    className={`input-field-elegant pl-10 ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-dark"></div>
                  ) : (
                    <>
                      <span>Send reset email</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {message && (
              <div className="mt-4 text-center text-sm text-gray-700">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
