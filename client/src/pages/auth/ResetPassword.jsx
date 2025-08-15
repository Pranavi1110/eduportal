import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { Lock, ArrowRight } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ResetPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setMessage("Invalid reset link");
    }
  }, [token, email]);

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/reset-password", {
        email,
        token,
        password: data.password,
      });
      setMessage(res.data.message || "Password has been reset");
      // Optionally redirect to login after short delay
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error("Reset password error", err);
      setMessage(err?.response?.data?.message || "Failed to reset password");
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Reset Password - Hubinity</title>
        <meta name="description" content="Reset your password" />
      </Helmet>

      <div className="min-h-screen bg-primary-card flex flex-col justify-center section-padding-sm">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-garamond font-bold text-primary-dark">
              Reset password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Set a new password for your account.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card-elegant py-8 px-4 sm:px-10">
            {message && (
              <div className="mb-4 text-center text-sm text-gray-700">
                {message}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className={`input-field-elegant pl-10 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    placeholder="Enter new password"
                  />
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !token || !email}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-dark"></div>
                  ) : (
                    <>
                      <span>Set new password</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
