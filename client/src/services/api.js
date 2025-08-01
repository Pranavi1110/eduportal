import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sessions
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // No need to add auth headers - sessions are handled automatically
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on authentication error
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getUserById: (id) => api.get(`/auth/users/${id}`),
  checkAuth: () => api.get('/auth/check'),
};

// Tasks API
export const tasksAPI = {
  getTasks: (params = {}) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  applyForTask: (id, data) => api.post(`/tasks/${id}/apply`, data),
  assignTask: (id, data) => api.put(`/tasks/${id}/assign`, data),
  submitDeliverables: (id, data) => api.post(`/tasks/${id}/deliverables`, data),
  reviewTask: (id, data) => api.post(`/tasks/${id}/review`, data),
};

// Students API
export const studentsAPI = {
  getStudents: (params = {}) => api.get('/students', { params }),
  getStudent: (id) => api.get(`/students/${id}`),
  updateStudentProfile: (data) => api.put('/students/profile', data),
  addSkill: (data) => api.post('/students/skills', data),
  updateSkill: (skillId, data) => api.put(`/students/skills/${skillId}`, data),
  removeSkill: (skillId) => api.delete(`/students/skills/${skillId}`),
  addProject: (data) => api.post('/students/projects', data),
  updateProject: (projectId, data) => api.put(`/students/projects/${projectId}`, data),
  removeProject: (projectId) => api.delete(`/students/projects/${projectId}`),
  addExperience: (data) => api.post('/students/experience', data),
  updateExperience: (experienceId, data) => api.put(`/students/experience/${experienceId}`, data),
  removeExperience: (experienceId) => api.delete(`/students/experience/${experienceId}`),
};

// Startups API
export const startupsAPI = {
  getStartups: (params = {}) => api.get('/startups', { params }),
  getStartup: (id) => api.get(`/startups/${id}`),
  updateStartupProfile: (data) => api.put('/startups/profile', data),
  createTask: (data) => api.post('/tasks', data),
  getStartupTasks: (params = {}) => api.get('/tasks', { params }),
};

// Messages API
export const messagesAPI = {
  getMessages: (params = {}) => api.get('/messages', { params }),
  getMessage: (id) => api.get(`/messages/${id}`),
  sendMessage: (data) => api.post('/messages', data),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

// Certificates API
export const certificatesAPI = {
  getCertificates: (params = {}) => api.get('/certificates', { params }),
  getCertificate: (id) => api.get(`/certificates/${id}`),
  downloadCertificate: (id) => api.get(`/certificates/${id}/download`),
  generateCertificate: (data) => api.post('/certificates', data),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api; 