import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { fetchAllStudents } from "../../services/students";
import { fetchAllStartups } from "../../services/startups";
import Avatar from "../../components/common/Avatar";
import StudentDashboard from "../student/StudentDashboard";
import StartupDashboard from "../startup/StartupDashboard";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [startups, setStartups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // simplified UI state
  const [view, setView] = useState("home"); // home | students | startups
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [viewing, setViewing] = useState(null); // 'student' | 'startup' | null
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studs = await fetchAllStudents();
        setStudents(Array.isArray(studs) ? studs : studs?.users || []);
      } catch (e) {
        setStudents([]);
      }

      try {
        const starts = await fetchAllStartups();
        setStartups(Array.isArray(starts) ? starts : starts?.users || []);
      } catch (e) {
        setStartups([]);
      }

      try {
        // admin should fetch all student tasks (route is /student/tasks/all)
        const res = await api.get("/student/tasks/all");
        setTasks(res.data || []);
      } catch (e) {
        setTasks([]);
        // capture error for admin UX
        setFetchError(
          e?.response?.status === 401 ? "unauthorized" : e.message || "failed"
        );
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const startupTasks = (startup) => {
    if (!startup) return [];
    return tasks.filter((t) => {
      if (!t.startup) return false;
      return (
        (typeof t.startup === "object" && t.startup._id === startup._id) ||
        t.startup === startup._id
      );
    });
  };

  const studentAssignedTasks = (student) => {
    if (!student) return [];
    const sid = student._id || student.id || student.email;
    return tasks.filter((t) => {
      if (t.assignedTo) {
        if (Array.isArray(t.assignedTo)) {
          return (
            t.assignedTo.includes(sid) || t.assignedTo.includes(student.email)
          );
        }
        return t.assignedTo === sid || t.assignedTo === student.email;
      }
      if (t.assignedStudent) {
        const asid =
          typeof t.assignedStudent === "object"
            ? t.assignedStudent._id
            : t.assignedStudent;
        return asid === sid || asid === student.email;
      }
      if (t.assignedStudents) {
        if (Array.isArray(t.assignedStudents))
          return t.assignedStudents.includes(sid);
      }
      return false;
    });
  };

  const studentSubmittedTasks = (student) => {
    if (!student) return [];
    return tasks.filter((t) =>
      (t.submissions || []).some((sub) => {
        const sid =
          typeof sub.student === "object"
            ? sub.student?._id || sub.student?.email
            : sub.student;
        return sid === (student._id || student.id) || sid === student.email;
      })
    );
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Hubinity</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-button to-primary-dark text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-garamond font-bold mb-4">
                Admin Dashboard
              </h1>
              <p className="text-xl text-gray-200 mb-6">
                Welcome back, {user?.firstName} — manage students and startups
              </p>
              <div className="flex justify-center space-x-8 text-center">
                <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                  <div className="text-2xl font-bold">{students.length}</div>
                  <div className="text-sm text-gray-200">Total Students</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                  <div className="text-2xl font-bold">{startups.length}</div>
                  <div className="text-sm text-gray-200">Total Startups</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg px-6 py-3">
                  <div className="text-2xl font-bold">{tasks.length}</div>
                  <div className="text-sm text-gray-200">Total Tasks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {view === "home" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div
                className="group cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                onClick={() => {
                  setView("students");
                  setSelectedStudent(null);
                  setSelectedStartup(null);
                }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary-dark">{students.length}</div>
                      <div className="text-sm text-gray-500">Students</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-primary-dark mb-3 group-hover:text-primary-button transition-colors">
                    Manage Students
                  </h3>
                  <p className="text-gray-600 mb-4">
                    View all students, their profiles, tasks, and submissions. Monitor their progress and engagement.
                  </p>
                  <div className="flex items-center text-primary-button font-medium group-hover:text-primary-dark transition-colors">
                    <span>View Students</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="group cursor-pointer bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                onClick={() => {
                  setView("startups");
                  setSelectedStartup(null);
                  setSelectedStudent(null);
                }}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary-dark">{startups.length}</div>
                      <div className="text-sm text-gray-500">Startups</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-primary-dark mb-3 group-hover:text-primary-button transition-colors">
                    Manage Startups
                  </h3>
                  <p className="text-gray-600 mb-4">
                    View all startups, their posted tasks, and student submissions. Monitor their activity and engagement.
                  </p>
                  <div className="flex items-center text-primary-button font-medium group-hover:text-primary-dark transition-colors">
                    <span>View Startups</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "students" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-primary-dark mb-2">Student Management</h2>
                  <p className="text-gray-600">Manage and view all student accounts and their activities</p>
                </div>
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
                  onClick={() => setView("home")}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-primary-dark">All Students ({students.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-button mx-auto mb-4"></div>
                      Loading students...
                    </div>
                  ) : students.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      No students found
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Student</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Institution</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {students.map((s) => (
                          <tr key={s._id || s.email} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <Avatar
                                  src={
                                    s.profilePicture ||
                                    s.profilePic ||
                                    s.avatar ||
                                    s.imageUrl
                                  }
                                  name={
                                    (s.firstName || "") +
                                      " " +
                                      (s.lastName || "") || s.email
                                  }
                                  sizeClass="w-12 h-12"
                                  className="rounded-full"
                                />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {(s.firstName || "") +
                                      " " +
                                      (s.lastName || "") || s.email}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {s.phone}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{s.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{s.college || s.institute || "N/A"}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="bg-gradient-to-r from-primary-button to-primary-dark text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
                                onClick={() => {
                                  const id = s._id || s.email;
                                  navigate(`/admin/students/${id}`);
                                }}
                              >
                                View Dashboard
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "startups" && (
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-primary-dark mb-2">Startup Management</h2>
                  <p className="text-gray-600">Manage and view all startup accounts and their activities</p>
                </div>
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
                  onClick={() => setView("home")}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </button>
              </div>

              {/* Startups Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-primary-dark">All Startups ({startups.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-button mx-auto mb-4"></div>
                      Loading startups...
                    </div>
                  ) : startups.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      No startups found
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Company</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {startups.map((st) => (
                          <tr key={st._id || st.email} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {(st.companyName || st.firstName || st.email)?.[0]?.toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {st.companyName || st.firstName || st.email}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {st.companySize}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{st.email}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="bg-gradient-to-r from-primary-button to-primary-dark text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-medium"
                                onClick={() => {
                                  const id = st._id || st.email;
                                  navigate(`/admin/startups/${id}`);
                                }}
                              >
                                View Dashboard
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
