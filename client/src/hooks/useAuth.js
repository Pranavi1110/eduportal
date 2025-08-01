import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check authentication status
  const { data: authData, isLoading: authLoading, error: authError } = useQuery(
    'auth',
    authAPI.checkAuth,
    {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Login mutation
  const loginMutation = useMutation(
    (credentials) => authAPI.login(credentials),
    {
      onSuccess: (data) => {
        queryClient.setQueryData('auth', data);
        toast.success('Login successful!');
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    }
  );

  // Register mutation
  const registerMutation = useMutation(
    (userData) => authAPI.register(userData),
    {
      onSuccess: (data) => {
        queryClient.setQueryData('auth', data);
        toast.success('Registration successful!');
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Registration failed');
      }
    }
  );

  // Logout mutation
  const logoutMutation = useMutation(
    () => authAPI.logout(),
    {
      onSuccess: () => {
        queryClient.setQueryData('auth', { success: true, authenticated: false });
        queryClient.clear();
        toast.success('Logged out successfully');
        navigate('/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Logout failed');
      }
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data) => authAPI.updateProfile(data),
    {
      onSuccess: (data) => {
        queryClient.setQueryData('auth', {
          ...queryClient.getQueryData('auth'),
          user: data.data
        });
        toast.success('Profile updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Profile update failed');
      }
    }
  );

  // Change password mutation
  const changePasswordMutation = useMutation(
    (data) => authAPI.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Password change failed');
      }
    }
  );

  return {
    // Auth state
    user: authData?.user || null,
    isAuthenticated: authData?.authenticated || false,
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
    isStudent: () => authData?.user?.userType === 'student',
    isStartup: () => authData?.user?.userType === 'startup',
    isAdmin: () => authData?.user?.userType === 'admin',
    isVerified: () => authData?.user?.isVerified || false,
  };
}; 