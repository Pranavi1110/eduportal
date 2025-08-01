import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { tasksAPI } from '../services/api';
import { 
  Briefcase, 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Clock,
  Star,
  Eye,
  Plus
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Tasks = () => {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    skills: ''
  });

  const { data: tasksData, isLoading, error, refetch } = useQuery(
    ['tasks', filters],
    () => tasksAPI.getTasks(filters),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'open':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center">
            <h1 className="text-3xl font-garamond font-bold text-primary-dark mb-6">
              Error Loading Tasks
            </h1>
            <p className="text-gray-600 mb-4">
              {error.message || 'Failed to load tasks'}
            </p>
            <button 
              onClick={() => refetch()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tasks = tasksData?.data || [];

  return (
    <>
      <Helmet>
        <title>Tasks - Hubinity</title>
        <meta name="description" content="Browse and manage tasks" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-primary-white shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-garamond font-bold text-primary-dark">
                  Browse Tasks
                </h1>
                <p className="text-gray-600 mt-1">
                  Find opportunities that match your skills
                </p>
              </div>
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Post New Task
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="card mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="form-label">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="form-label">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                  <option value="research">Research</option>
                  <option value="writing">Writing</option>
                  <option value="data-analysis">Data Analysis</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="form-label">Skills</label>
                <input
                  type="text"
                  placeholder="e.g., React, Python, Design"
                  value={filters.skills}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Tasks Grid */}
          {tasks.length === 0 ? (
            <div className="card text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary-dark mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or check back later for new opportunities.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <div key={task._id} className="card hover:shadow-medium transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary-dark mb-2">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {task.startup?.companyName || 'Unknown Company'}
                      </p>
                    </div>
                    <button className="btn-ghost p-2">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      <span>${task.budget.min} - ${task.budget.max}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{task.estimatedHours} hours</span>
                    </div>

                    {task.startup?.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{task.startup.location.city}, {task.startup.location.state}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {task.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="badge-secondary text-xs">
                          {skill}
                        </span>
                      ))}
                      {task.skills.length > 3 && (
                        <span className="badge-secondary text-xs">
                          +{task.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm text-gray-600">
                        {task.startup?.averageRating || 0} ({task.startup?.totalReviews || 0})
                      </span>
                    </div>
                    <button className="btn-primary text-sm">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {tasksData?.pagination && tasksData.pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                {Array.from({ length: tasksData.pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`px-3 py-2 rounded-lg ${
                      tasksData.pagination.page === i + 1
                        ? 'bg-primary-button text-primary-dark'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Tasks; 