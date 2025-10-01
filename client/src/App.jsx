// ...existing code...
import Chat from "./pages/Chat";
import StartupProfile from "./pages/startup/StartupProfile";
import PostWork from "./pages/startup/PostWork";
import BrowseStudents from "./pages/startup/BrowseStudents";
import Students from "./pages/startup/Students";
import StudentProfile from "./pages/startup/StudentProfile";
import Submissions from "./pages/startup/Submissions";
import StartupTasks from "./pages/startup/StartupTasks";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "react-query";
import { useAuth } from "./hooks/useAuth";

// Layout components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages
import Home from "./pages/Home";
import HelpCenter from "./pages/HelpCenter";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import StudentDashboard from "./pages/student/StudentDashboard";
import StartupDashboard from "./pages/startup/StartupDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudentView from "./pages/admin/AdminStudentView";
import AdminStartupView from "./pages/admin/AdminStartupView";
import AdminStudentTasks from "./pages/admin/AdminStudentTasks";
import AdminStartupTasks from "./pages/admin/AdminStartupTasks";
import Profile from "./pages/Profile";
import Tasks from "./pages/Tasks";
import Messages from "./pages/Messages";
import Certificates from "./pages/Certificates";
const ForgotPassword = React.lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/auth/ResetPassword"));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, allowedUserTypes = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary-button border-t-transparent shadow-soft"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedUserTypes.length > 0 &&
    !allowedUserTypes.includes(user?.userType)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary-button border-t-transparent shadow-soft"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Dashboard Route Component
const DashboardRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-primary-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-primary-button border-t-transparent shadow-soft"></div>
      </div>
    );
  }

  switch (user.userType) {
    case "student":
      return <StudentDashboard />;
    case "startup":
      return <StartupDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <Navigate to="/" replace />;
  }
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><React.Suspense fallback={<div>Loading...</div>}><ForgotPassword /></React.Suspense></PublicRoute>} />
                <Route path="/reset-password" element={<PublicRoute><React.Suspense fallback={<div>Loading...</div>}><ResetPassword /></React.Suspense></PublicRoute>} />
                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/messages" element={<ProtectedRoute allowedUserTypes={["student", "startup"]}><Messages /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute allowedUserTypes={["student", "startup"]}><Chat /></ProtectedRoute>} />
                <Route path="/chat/:userId" element={<ProtectedRoute allowedUserTypes={["student", "startup"]}><Chat /></ProtectedRoute>} />
                <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
                {/* Student Routes */}
                <Route path="/student/dashboard" element={<ProtectedRoute allowedUserTypes={["student"]}><StudentDashboard /></ProtectedRoute>} />
                {/* Startup Routes */}
                <Route path="/startup/dashboard" element={<ProtectedRoute allowedUserTypes={["startup"]}><StartupDashboard /></ProtectedRoute>} />
                <Route path="/startup/post-work" element={<ProtectedRoute allowedUserTypes={["startup"]}><PostWork /></ProtectedRoute>} />
                <Route path="/startup/browse-students" element={<ProtectedRoute allowedUserTypes={["startup"]}><BrowseStudents /></ProtectedRoute>} />
                <Route path="/startup/students" element={<ProtectedRoute allowedUserTypes={["startup"]}><Students /></ProtectedRoute>} />
                <Route path="/startup/students/:studentId" element={<ProtectedRoute allowedUserTypes={["startup"]}><StudentProfile /></ProtectedRoute>} />
                <Route path="/startup/submissions" element={<ProtectedRoute allowedUserTypes={["startup"]}><Submissions /></ProtectedRoute>} />
                <Route path="/startup/tasks" element={<ProtectedRoute allowedUserTypes={["startup"]}><StartupTasks /></ProtectedRoute>} />
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedUserTypes={["admin"]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/students/:studentId" element={<ProtectedRoute allowedUserTypes={["admin"]}><AdminStudentView /></ProtectedRoute>} />
                <Route path="/admin/students/:studentId/tasks" element={<ProtectedRoute allowedUserTypes={["admin"]}><AdminStudentTasks /></ProtectedRoute>} />
                <Route path="/admin/students/:studentId/profile" element={<ProtectedRoute allowedUserTypes={["admin"]}><StudentProfile /></ProtectedRoute>} />
                <Route path="/admin/startups/:startupId" element={<ProtectedRoute allowedUserTypes={["admin"]}><AdminStartupView /></ProtectedRoute>} />
                <Route path="/admin/startups/:startupId/profile" element={<ProtectedRoute allowedUserTypes={["admin"]}><StartupProfile /></ProtectedRoute>} />
                <Route path="/admin/startups/:startupId/tasks" element={<ProtectedRoute allowedUserTypes={["admin"]}><AdminStartupTasks /></ProtectedRoute>} />
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/help" element={<HelpCenter />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff"
              }
            }}
          />
        </Router>
      </HelmetProvider>
    </QueryClientProvider>
  );

}
export default App;

