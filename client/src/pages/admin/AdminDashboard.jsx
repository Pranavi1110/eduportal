import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../hooks/useAuth';
import { 
  Shield, 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Mock data - replace with real API calls
  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users, color: 'text-blue-600' },
    { label: 'Active Startups', value: '89', icon: Building, color: 'text-green-600' },
    { label: 'Pending Verifications', value: '23', icon: AlertCircle, color: 'text-yellow-600' },
    { label: 'Platform Revenue', value: '$12,450', icon: DollarSign, color: 'text-purple-600' }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'user_registration',
      message: 'New student registered: Sarah Chen',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'verification',
      message: 'Startup verification approved: TechStart Inc.',
      time: '15 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'task_completion',
      message: 'Task completed: Frontend Development',
      time: '1 hour ago',
      status: 'success'
    },
    {
      id: 4,
      type: 'dispute',
      message: 'New dispute filed: Payment issue',
      time: '2 hours ago',
      status: 'warning'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return Users;
      case 'verification':
        return CheckCircle;
      case 'task_completion':
        return TrendingUp;
      case 'dispute':
        return AlertCircle;
      default:
        return Eye;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Hubinity</title>
        <meta name="description" content="Admin dashboard for Hubinity platform" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-primary-white shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-garamond font-bold text-primary-dark">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {user?.firstName}! Manage the platform
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="btn-secondary">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  View Reports
                </button>
                <button className="btn-primary">
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Users
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg bg-gray-100 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-primary-dark">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-primary-dark">
                    Recent Activities
                  </h2>
                  <button className="btn-ghost text-sm">
                    View All
                  </button>
                </div>
                
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const IconComponent = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-lg bg-white ${getActivityColor(activity.status)}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-primary-dark">{activity.message}</p>
                          <p className="text-sm text-gray-600">{activity.time}</p>
                        </div>
                        <button className="btn-ghost p-1">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions & System Status */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-xl font-semibold text-primary-dark mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Users className="w-5 h-5 text-primary-button mr-3" />
                    <span>Manage Users</span>
                  </button>
                  <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <CheckCircle className="w-5 h-5 text-primary-button mr-3" />
                    <span>Review Verifications</span>
                  </button>
                  <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <AlertCircle className="w-5 h-5 text-primary-button mr-3" />
                    <span>Handle Disputes</span>
                  </button>
                  <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <TrendingUp className="w-5 h-5 text-primary-button mr-3" />
                    <span>View Analytics</span>
                  </button>
                </div>
              </div>

              {/* System Status */}
              <div className="card">
                <h2 className="text-xl font-semibold text-primary-dark mb-4">
                  System Status
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-primary-dark">Platform Online</p>
                      <p className="text-sm text-gray-600">All systems operational</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-primary-dark">Database</p>
                      <p className="text-sm text-gray-600">Connected and healthy</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-primary-dark">Email Service</p>
                      <p className="text-sm text-gray-600">23 pending verifications</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard; 