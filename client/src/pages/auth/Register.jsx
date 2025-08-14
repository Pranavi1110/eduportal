import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Building,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userType, setUserType] = useState("student");
  const { register: registerUser, isRegisterLoading, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = (data) => {
    const userData = {
      ...data,
      userType,
    };
    registerUser(userData);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Register - Hubinity</title>
        <meta name="description" content="Create your Hubinity account" />
      </Helmet>

      <div className="min-h-screen bg-primary-card flex flex-col justify-center section-padding-sm">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-3xl font-garamond font-bold text-primary-dark">
              Join Hubinity
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your account to get started
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="card-elegant py-8 px-4 sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* User Type Selection */}
              <div>
                <label className="form-label">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("student")}
                    className={`p-3 rounded-xl border-2 transition-all shadow-subtle focus-visible-elegant ${
                      userType === "student"
                        ? "border-primary-button bg-primary-button text-primary-dark"
                        : "border-gray-300 bg-primary-card text-primary-dark hover:border-gray-400"
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Student</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("startup")}
                    className={`p-3 rounded-xl border-2 transition-all shadow-subtle focus-visible-elegant ${
                      userType === "startup"
                        ? "border-primary-button bg-primary-button text-primary-dark"
                        : "border-gray-300 bg-primary-card text-primary-dark hover:border-gray-400"
                    }`}
                  >
                    <Building className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">Startup</span>
                  </button>
                </div>
              </div>

              {/* Name/Company Fields */}
              {userType === "student" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="form-label">
                      First name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        {...register("firstName", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "First name must be at least 2 characters",
                          },
                        })}
                        className={`input-field-elegant pl-10 ${
                          errors.firstName ? "border-red-500" : ""
                        }`}
                        placeholder="First name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="form-error">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="form-label">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      {...register("lastName", {
                        required: "Last name is required",
                        minLength: {
                          value: 2,
                          message: "Last name must be at least 2 characters",
                        },
                      })}
                      className={`input-field-elegant ${
                        errors.lastName ? "border-red-500" : ""
                      }`}
                      placeholder="Last name"
                    />
                    {errors.lastName && (
                      <p className="form-error">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="companyName" className="form-label">
                    Company Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="companyName"
                      type="text"
                      autoComplete="organization"
                      {...register("companyName", {
                        required: "Company name is required",
                        minLength: {
                          value: 2,
                          message: "Company name must be at least 2 characters",
                        },
                      })}
                      className={`input-field-elegant pl-10 ${
                        errors.companyName ? "border-red-500" : ""
                      }`}
                      placeholder="Company name"
                    />
                  </div>
                  {errors.companyName && (
                    <p className="form-error">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
              )}

              {/* Email Field */}
              <div>
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
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className={`input-field-elegant pl-10 ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Conditional Fields */}
              {userType === "student" && (
                <div>
                  <label htmlFor="college" className="form-label">
                    College/University (optional)
                  </label>
                  <input
                    id="college"
                    type="text"
                    {...register("college")}
                    className="input-field-elegant"
                    placeholder="Your college or university"
                  />
                </div>
              )}

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className={`input-field-elegant pl-10 pr-10 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center focus-visible-elegant"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === password || "Passwords do not match",
                    })}
                    className={`input-field-elegant pl-10 pr-10 ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center focus-visible-elegant"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className="btn-primary w-full flex justify-center items-center"
                >
                  {isRegisterLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-dark"></div>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary-button hover:text-primary-dark transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
