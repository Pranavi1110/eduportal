import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { useAuth } from '../../hooks/useAuth';
import { studentsAPI, tasksAPI } from '../../services/api';
import { 
  User, 
  Briefcase, 
  DollarSign, 
  Award, 
  Clock, 
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StudentDashboard = () => {
  const { user } = useAuth();

  const { data: studentData, isLoading: studentLoading } = useQuery(
    ['student', user?.id],
    () => studentsAPI.getStudent(user.id),
    {
      enabled: !!user?.id,
      refetchOnWindowFocus: false,
    }
  );

  const { data: tasksData, isLoading: tasksLoading } = useQuery(
    ['student-tasks', user?.id],
    () => tasksAPI.getTasks({ assignedStudent: user?.id }),
    {
      enabled: !!user?.id,
      refetchOnWindowFocus: false,
    }
  );

  if (studentLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const student = studentData?.data || {};
  const tasks = tasksData?.data || [];

  // Calculate statistics
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const activeTasks = tasks.filter(task => task.status === 'in-progress').length;
  const totalEarnings = tasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + (task.budget?.max || 0), 0);
  const verifiedSkills = student.skills?.filter(skill => skill.isVerified).length || 0;

  const recentTasks = tasks.slice(0, 5);

  return (
    <>
      <Helmet>
        <title>Student Dashboard - Hubinity</title>
        <meta name="description" content="Student dashboard overview" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-primary-white shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-garamond font-bold text-primary-dark">
                  Welcome back, {student.firstName}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Here's what's happening with your tasks and skills
                </p>
              </div>
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
                  <p className="text-2xl font-bold text-primary-dark">{completedTasks}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                  <p className="text-2xl font-bold text-primary-dark">{activeTasks}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-primary-dark">${totalEarnings}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified Skills</p>
                  <p className="text-2xl font-bold text-primary-dark">{verifiedSkills}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Tasks */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-dark">Recent Tasks</h2>
                <button className="btn-ghost text-sm">View All</button>
              </div>
              
              {recentTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-primary-dark">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.startup?.companyName}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status.replace('-', ' ')}
                        </span>
                        <button className="btn-ghost p-1">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-primary-dark">Your Skills</h2>
                <button className="btn-ghost text-sm">Manage</button>
              </div>
              
              {student.skills?.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No skills added yet</p>
                  <button className="btn-primary mt-4">Add Your First Skill</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {student.skills?.slice(0, 5).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="font-medium text-primary-dark">{skill.name}</span>
                        {skill.isVerified && (
                          <Award className="w-4 h-4 text-green-500 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${
                          skill.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {skill.isVerified ? 'Verified' : 'Pending'}
                        </span>
                        <span className="text-sm text-gray-600">Level {skill.level || 1}</span>
                      </div>
                    </div>
                  ))}
                  {student.skills?.length > 5 && (
                    <button className="btn-ghost text-sm w-full">
                      View {student.skills.length - 5} more skills
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-primary-dark mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="card hover:shadow-medium transition-shadow text-left">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-primary-dark">Browse Tasks</h3>
                    <p className="text-sm text-gray-600">Find new opportunities</p>
                  </div>
                </div>
              </button>

              <button className="card hover:shadow-medium transition-shadow text-left">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-primary-dark">Add Skills</h3>
                    <p className="text-sm text-gray-600">Update your profile</p>
                  </div>
                </div>
              </button>

              <button className="card hover:shadow-medium transition-shadow text-left">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-primary-dark">View Analytics</h3>
                    <p className="text-sm text-gray-600">Track your progress</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard; 