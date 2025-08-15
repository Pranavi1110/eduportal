import { useMutation, useQueryClient } from "react-query";
import { registerUser, loginUser } from "../routes/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import api from "../services/api"; // Adjust the import based on your project structure

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Auth state from localStorage
  const [authData, setAuthData] = useState(() => {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Keep localStorage in sync with authData
  useEffect(() => {
    if (authData) {
      localStorage.setItem("auth", JSON.stringify(authData));
    } else {
      localStorage.removeItem("auth");
    }
  }, [authData]);

  // Login mutation
  const loginMutation = useMutation((credentials) => loginUser(credentials), {
    onSuccess: (data) => {
      setAuthData(data);
      queryClient.setQueryData("auth", data);
      toast.success("Login successful!");
      console.log(authData);
      setTimeout(() => navigate("/dashboard"), 1000);
    },
    onError: (error) => {
      setAuthError(error);
      toast.error(error.message || "Login failed");
    },
  });

  // Register mutation
  const registerMutation = useMutation((userData) => registerUser(userData), {
    onSuccess: (data) => {
      setAuthData(data);
      queryClient.setQueryData("auth", data);
      toast.success("Registration successful!");
      navigate("/dashboard");
    },
    onError: (error) => {
      setAuthError(error);
      toast.error(error.message || "Registration failed");
    },
  });

  // Logout mutation
  const logoutMutation = {
    mutate: () => {
      setAuthData(null);
      localStorage.removeItem("auth");
      queryClient.removeQueries("auth");
      toast.success("Logged out successfully!");
      navigate("/login");
    },
  };

  // Update profile mutation stub
  const updateProfileMutation = {
    mutate: () => {
      toast("Update profile not implemented");
    },
  };

  // Change password mutation stub
  const changePasswordMutation = {
    mutate: () => {
      toast("Change password not implemented");
    },
  };

  return {
    // Auth state
    user: authData?.user || null,
    authData,
    isAuthenticated: !!authData?.token || !!authData?.user,
    isLoading: authLoading,
    error: authError,

    // Auth methods
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,

    // Loading states
    isLoginLoading: loginMutation.isLoading,
    isRegisterLoading: registerMutation.isLoading,
    isLogoutLoading: logoutMutation.isLoading,
    isUpdateProfileLoading: updateProfileMutation.isLoading,
    isChangePasswordLoading: changePasswordMutation.isLoading,

    // Helper methods
    isStudent: () => authData?.user?.userType === "student",
    isStartup: () => authData?.user?.userType === "startup",
    isAdmin: () => authData?.user?.userType === "admin",
    isVerified: () => authData?.user?.isVerified || false,
  };
};

export async function forgotPassword(email) {
  return api.post("/forgot-password", { email });
}
