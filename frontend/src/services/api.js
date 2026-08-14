import axios from 'axios';

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle token refresh on 401
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if the refresh request itself fails
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/signup') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Retry the original request with the new session cookies
        return apiInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, clear auth and log out
        window.dispatchEvent(new Event('auth-logout'));
        const refreshMsg = refreshError.response?.data?.message || refreshError.message || 'Session expired';
        return Promise.reject(new Error(refreshMsg));
      }
    }

    // Standardize thrown errors to have their backend message in the Error.message field
    const errorMsg = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(errorMsg));
  }
);

export const api = {
  // Auth API
  sendOtp: (email) => apiInstance.post('/auth/send-otp', { email }).then(res => res.data),
  verifyOtp: (email, otp) => apiInstance.post('/auth/verify-otp', { email, otp }).then(res => res.data),
  signup: (name, email, password) => apiInstance.post('/auth/signup', { name, email, password }).then(res => res.data),
  login: (email, password) => apiInstance.post('/auth/login', { email, password }).then(res => res.data),
  googleLogin: (credential) => apiInstance.post('/auth/google', { credential }).then(res => res.data),
  logout: () => apiInstance.post('/auth/logout').then(res => res.data),
  forgotPassword: (email) => apiInstance.post('/auth/forgot-password', { email }).then(res => res.data),
  resetPassword: (token, newPassword) => apiInstance.post('/auth/reset-password', { token, newPassword }).then(res => res.data),
  searchUsers: (email) => apiInstance.get(`/auth/users/search?email=${encodeURIComponent(email)}`).then(res => res.data),

  // Workspaces API
  getWorkspaces: () => apiInstance.get('/workspace').then(res => res.data),
  createWorkspace: (name, description) => apiInstance.post('/workspace', { name, description }).then(res => res.data),
  getWorkspace: (id) => apiInstance.get(`/workspace/${id}`).then(res => res.data),
  updateWorkspace: (id, name, description) => apiInstance.patch(`/workspace/${id}`, { name, description }).then(res => res.data),
  deleteWorkspace: (id) => apiInstance.delete(`/workspace/${id}`).then(res => res.data),
  getWorkspaceMembers: (workspaceId) => apiInstance.get(`/workspace/${workspaceId}/members`).then(res => res.data),
  inviteWorkspaceMember: (workspaceId, userIds, role = 'member') => apiInstance.post(`/workspace/${workspaceId}/members`, { userIds: Array.isArray(userIds) ? userIds : [userIds], role }).then(res => res.data),
  updateWorkspaceMemberRole: (workspaceId, memberId, role) => apiInstance.put(`/workspace/${workspaceId}/members/${memberId}`, { role }).then(res => res.data),
  removeWorkspaceMember: (workspaceId, memberId) => apiInstance.delete(`/workspace/${workspaceId}/members/${memberId}`).then(res => res.data),
  getInviteByToken: (token) => apiInstance.get(`/workspace/invitations/token/${token}`).then(res => res.data),
  acceptInvite: (token) => apiInstance.post(`/workspace/invitations/${token}/accept`, { token }).then(res => res.data),
  rejectInvite: (token) => apiInstance.post(`/workspace/invitations/${token}/reject`, { token }).then(res => res.data),

  // Projects API
  getProjects: (workspaceId) => apiInstance.get(`/projects/workspace/${workspaceId}`).then(res => res.data),
  createProject: (workspaceId, name, description, managerId) => apiInstance.post(`/projects/workspace/${workspaceId}`, { name, description, managerId }).then(res => res.data),
  getProject: (projectId) => apiInstance.get(`/projects/${projectId}`).then(res => res.data),
  updateProject: (projectId, updates) => apiInstance.put(`/projects/${projectId}`, updates).then(res => res.data),
  deleteProject: (projectId) => apiInstance.delete(`/projects/${projectId}`).then(res => res.data),
  getProjectMembers: (projectId) => apiInstance.get(`/projects/${projectId}/members`).then(res => res.data),
  addProjectMember: (projectId, userIds, role = 'member') => apiInstance.post(`/projects/${projectId}/members`, { userIds: Array.isArray(userIds) ? userIds : [userIds], role }).then(res => res.data),
  updateProjectMemberRole: (projectId, memberId, role) => apiInstance.put(`/projects/${projectId}/members/${memberId}`, { role }).then(res => res.data),
  removeProjectMember: (projectId, memberId) => apiInstance.delete(`/projects/${projectId}/members/${memberId}`).then(res => res.data),

  // Tasks API
  getTasks: (projectId) => apiInstance.get(`/tasks/project/${projectId}`).then(res => res.data),
  getTaskById: (taskId) => apiInstance.get(`/tasks/${taskId}`).then(res => res.data),
  createTask: (projectId, taskData) => apiInstance.post(`/tasks/project/${projectId}`, taskData).then(res => res.data),
  updateTask: (taskId, taskData) => apiInstance.put(`/tasks/${taskId}`, taskData).then(res => res.data),
  deleteTask: (taskId) => apiInstance.delete(`/tasks/${taskId}`).then(res => res.data),

  // Comments API
  getTaskComments: (taskId) => apiInstance.get(`/comments/task/${taskId}`).then(res => res.data),
  createTaskComment: (taskId, formData) => apiInstance.post(`/comments/task/${taskId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(res => res.data),
  updateComment: (commentId, content) => apiInstance.put(`/comments/${commentId}`, { content }).then(res => res.data),
  deleteComment: (commentId) => apiInstance.delete(`/comments/${commentId}`).then(res => res.data),

  // Notifications API
  getNotifications: () => apiInstance.get('/notifications').then(res => res.data),
  getUnreadCount: () => apiInstance.get('/notifications/unread-count').then(res => res.data),
  markAllAsRead: () => apiInstance.patch('/notifications/read-all').then(res => res.data),
  markAsRead: (id) => apiInstance.patch(`/notifications/${id}/read`).then(res => res.data),
  deleteNotification: (id) => apiInstance.delete(`/notifications/${id}`).then(res => res.data),
};
