import React, { useState } from "react";
import logo from "../../../logo.jpg";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Home,
  Briefcase,
  MessageSquare,
  Award,
  Users,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLogoutLoading } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: User },
    // Tasks shown only for non-admins; render conditionally below
    { name: "Tasks", href: "/tasks", icon: Briefcase },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    // Certificates link rendered conditionally below
  ];

  // Helper to get initial for avatar
  const getUserInitial = () => {
    if (user?.userType === "startup" && user?.companyName?.trim()) {
      return user.companyName.trim().charAt(0).toUpperCase();
    }
    if (user?.firstName?.trim()) {
      return user.firstName.trim().charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <nav className="bg-primary-white shadow-soft sticky top-0 z-50">
      <div className="container-responsive">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center focus-visible-elegant">
              <img
                src={logo}
                alt="Hubinity logo"
                className="w-8 h-8 rounded-lg object-cover mr-2 shadow-soft"
              />
              <span className="text-xl font-garamond font-bold text-primary-dark">
                Hubinity
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                // Hide Tasks, Chat and Messages links for admin
                if (
                  (item.name === "Tasks" ||
                    item.name === "Chat" ||
                    item.name === "Messages") &&
                  user?.userType === "admin"
                )
                  return null;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link focus-visible-elegant ${
                      isActive(item.href)
                        ? "nav-link-active"
                        : "nav-link-inactive"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* Certificates link only for non-startup users; Submissions link for startups */}
              {user?.userType !== "startup" && user?.userType !== "admin" && (
                <Link
                  key="Certificates"
                  to="/certificates"
                  className={`nav-link focus-visible-elegant ${
                    isActive("/certificates")
                      ? "nav-link-active"
                      : "nav-link-inactive"
                  }`}
                >
                  Certificates
                </Link>
              )}
              {user?.userType === "startup" && (
                <Link
                  key="Submissions"
                  to="/startup/submissions"
                  className={`nav-link focus-visible-elegant ${
                    isActive("/startup/submissions")
                      ? "nav-link-active"
                      : "nav-link-inactive"
                  }`}
                >
                  Submissions
                </Link>
              )}
              {user?.userType === "startup" && (
                <Link
                  key="Students"
                  to="/startup/students"
                  className={`nav-link focus-visible-elegant ${
                    isActive("/startup/students")
                      ? "nav-link-active"
                      : "nav-link-inactive"
                  }`}
                >
                  Students
                </Link>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            {isAuthenticated ? (
              <div className="ml-4 flex items-center md:ml-6">
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-button rounded-full flex items-center justify-center shadow-soft">
                        <span className="text-primary-dark text-sm font-medium">
                          {getUserInitial()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-primary-dark">
                        {user?.userType === "startup" && user?.companyName
                          ? user.companyName
                          : `${user?.firstName || ""} ${
                              user?.lastName || ""
                            }`.trim()}
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-1 rounded-full text-gray-400 hover:text-primary-dark focus-visible-elegant transition-colors duration-200"
                      >
                        <Menu className="h-5 w-5" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMobileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-primary-white rounded-xl shadow-elegant py-1 z-50 border border-gray-100">
                          <Link
                            to="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-card transition-colors duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <User className="mr-3 h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-card transition-colors duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Profile
                          </Link>
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsMobileMenuOpen(false);
                            }}
                            disabled={isLogoutLoading}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary-card disabled:opacity-50 transition-colors duration-200"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            {isLogoutLoading ? "Signing out..." : "Sign out"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus-visible-elegant"
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-primary-dark hover:bg-primary-card focus-visible-elegant transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-primary-white border-t border-gray-200 shadow-soft">
            {navigation.map((item) => {
              if (item.name === "Tasks" && user?.userType === "admin")
                return null;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? "text-primary-button bg-primary-card shadow-soft"
                      : "text-gray-600 hover:text-primary-dark hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {React.createElement(item.icon, {
                    className: "mr-3 h-5 w-5",
                  })}
                  {item.name}
                </Link>
              );
            })}

            {/* Certificates link only for non-startup users (mobile); Submissions link for startups */}
            {user?.userType !== "startup" && user?.userType !== "admin" && (
              <Link
                key="Certificates"
                to="/certificates"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive("/certificates")
                    ? "text-primary-button bg-primary-card shadow-soft"
                    : "text-gray-600 hover:text-primary-dark hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Award className="mr-3 h-5 w-5" />
                Certificates
              </Link>
            )}
            {user?.userType === "startup" && (
              <Link
                key="Submissions"
                to="/startup/submissions"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive("/startup/submissions")
                    ? "text-primary-button bg-primary-card shadow-soft"
                    : "text-gray-600 hover:text-primary-dark hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Briefcase className="mr-3 h-5 w-5" />
                Submissions
              </Link>
            )}
            {user?.userType === "startup" && (
              <Link
                key="Students"
                to="/startup/students"
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive("/startup/students")
                    ? "text-primary-button bg-primary-card shadow-soft"
                    : "text-gray-600 hover:text-primary-dark hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="mr-3 h-5 w-5" />
                Students
              </Link>
            )}

            {isAuthenticated ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="w-8 h-8 bg-primary-button rounded-full flex items-center justify-center shadow-soft">
                    <span className="text-primary-dark text-sm font-medium">
                      {getUserInitial()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-primary-dark">
                      {user?.userType === "startup" && user?.companyName
                        ? user.companyName
                        : `${user?.firstName || ""} ${
                            user?.lastName || ""
                          }`.trim()}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:text-primary-dark hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-base font-medium text-gray-600 hover:text-primary-dark hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLogoutLoading}
                    className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-600 hover:text-primary-dark hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    {isLogoutLoading ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-primary-dark transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 text-base font-medium text-primary-button hover:text-primary-dark transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
