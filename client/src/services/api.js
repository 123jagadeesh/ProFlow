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

export const adminSignUp = async (companyName, email, password) => {
  try {
    const response = await api.post('/auth/admin-signup', { companyName, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const signIn = async (email, password) => {
  try {
    const response = await api.post('/auth/signin', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response.data;
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
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getProjectById = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', taskData);
    console.log(response.data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getTasks = async (projectId, assigneeId) => {
  try {
    let url = '/tasks';
    const params = new URLSearchParams();
    if (projectId) {
      params.append('projectId', projectId);
    }
    if (assigneeId) {
      params.append('assigneeId', assigneeId);
    }
    if (params.toString()) {
      url = `${url}?${params.toString()}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createPersonalTask = async (taskData) => {
  try {
    const response = await api.post('/personal-tasks', taskData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getPersonalTasks = async () => {
  try {
    const response = await api.get('/personal-tasks');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updatePersonalTask = async (id, taskData) => {
  try {
    const response = await api.put(`/personal-tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deletePersonalTask = async (id) => {
  try {
    const response = await api.delete(`/personal-tasks/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
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