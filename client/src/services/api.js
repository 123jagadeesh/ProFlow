import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Assuming your backend runs on port 5000

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const adminSignUp = async (companyName, companyLocation, adminName, email, password) => {
  try {
    const response = await api.post('/auth/admin-signup', { 
      companyName, 
      companyLocation,
      adminName,
      email, 
      password 
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    
    return response.data;
  } catch (error) {
    // Handle different error response formats
    const errorData = error.response?.data || { message: 'Signup failed. Please try again.' };
    throw errorData;
  }
};

export const signIn = async (email, password) => {
  try {
    const response = await api.post('/auth/signin', { email, password });
    
    // The backend should return { token, user } structure
    if (!response.data.token || !response.data.user) {
      throw new Error('Invalid response from server');
    }
    
    // The token is handled by the interceptor
    // User data will be handled by the AuthContext
    return response.data;
  } catch (error) {
    console.error('Sign in API error:', error);
    // Re-throw the error to be handled by the component
    throw error.response?.data || error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  // Optionally, remove user data or other session-related items
};

// You can add more API functions here for other features
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const addEmployee = async (name, email, password) => {
  try {
    const response = await api.post('/employees', { name, email, password });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createProject = async (name, customer) => {
  try {
    const response = await api.post('/projects', { name, customer });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getProjects = async () => {
  try {
    console.log('Fetching projects...');
    const response = await api.get('/projects');
    console.log('Projects response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getProjects:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error.response?.data || { message: error.message };
  }
};

export const getProjectById = async (id) => {
  try {
    console.log(`Fetching project with ID: ${id}`);
    const response = await api.get(`/projects/${id}`);
    console.log('Project by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getProjectById:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error.response?.data || { message: error.message };
  }
};

// ======================
// TASK MANAGEMENT
// ======================

// Admin Task Functions
export const getTasks = async (projectId) => {
  try {
    const url = projectId ? `/tasks?projectId=${projectId}` : '/tasks';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error.response?.data || error;
  }
};

export const getTask = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error.response?.data || error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error.response?.data || error;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error.response?.data || error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error.response?.data || error;
  }
};

// Employee Task Functions
export const getAssignedTasks = async (projectId, status) => {
  try {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (status) params.append('status', status);
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?._id) {
      params.append('assigneeId', user._id);
    }
    
    const url = `/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching assigned tasks:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error.response?.data || error;
  }
};

export const getAssignedTask = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error.response?.data || error;
  }
};

export const updateTaskStatus = async (taskId, status, comment) => {
  try {
    const response = await api.put(`/tasks/${taskId}`, { 
      status,
      comment 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error.response?.data || error;
  }
};

export const logWork = async (taskId, hours, date, description) => {
  try {
    const response = await api.post(`/tasks/${taskId}/comments`, {
      message: `Work logged: ${hours} hours - ${description}`,
      isWorkLog: true,
      hours: Number(hours),
      date: date || new Date().toISOString().split('T')[0]
    });
    return response.data;
  } catch (error) {
    console.error('Error logging work:', error);
    throw error.response?.data || error;
  }
};

// Task Comments
export const addCommentToTask = async (taskId, commentData) => {
  try {
    console.log('Adding comment:', { taskId, commentData });
    const response = await api.post(`/tasks/${taskId}/comments`, 
      { message: commentData.message || commentData.text || '' },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      }
    );
    
    console.log('Comment added, response:', response.data);
    
    // Get the updated task with the new comment
    const taskResponse = await api.get(`/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('Updated task data:', taskResponse.data);
    return taskResponse.data;
  } catch (error) {
    console.error('Error adding comment:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      request: {
        url: `/tasks/${taskId}/comments`,
        method: 'POST',
        data: { message: commentData.message || commentData.text || '' },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') ? '***' : 'not set'}`
        }
      }
    });
    throw error.response?.data || error;
  }
};

// Task Attachments
export const uploadAttachmentToTask = async (taskId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading attachment:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error.response?.data || error;
  }
};

export const downloadAttachment = async (taskId, attachmentId) => {
  try {
    const response = await api.get(`/tasks/${taskId}/attachments/${attachmentId}`, {
      responseType: 'blob',
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from content-disposition header if available
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'attachment';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch != null && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading attachment:', error);
    throw error.response?.data || error;
  }
};

export const deleteAttachment = async (taskId, attachmentId) => {
  try {
    const response = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error.response?.data || error;
  }
};

export const getEmployees = async () => {
  try {
    const response = await api.get('/employees');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// SPRINTS
export const createSprint = async (sprintData) => {
  try {
    const response = await api.post('/sprints', sprintData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getSprints = async (projectId) => {
  try {
    const response = await api.get(`/sprints${projectId ? `?projectId=${projectId}` : ''}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getSprintById = async (id) => {
  try {
    const response = await api.get(`/sprints/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateSprint = async (id, sprintData) => {
  try {
    const response = await api.put(`/sprints/${id}`, sprintData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteSprint = async (id) => {
  try {
    const response = await api.delete(`/sprints/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const addIssueToSprint = async (sprintId, taskId) => {
  try {
    const response = await api.post('/sprints/add-issue', { sprintId, taskId });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const removeIssueFromSprint = async (sprintId, taskId) => {
  try {
    const response = await api.post('/sprints/remove-issue', { sprintId, taskId });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Upload an attachment to a project
export const uploadAttachmentToProject = async (projectId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/projects/${projectId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Task Comments
export const addComment = async (commentData) => {
  try {
    const response = await api.post('/api/tasks/comment', commentData);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const getComments = async (taskId) => {
  try {
    const response = await api.get(`/api/tasks/${taskId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Task Attachments
export const uploadAttachment = async (formData) => {
  try {
    const response = await api.post('/api/tasks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
};
