/* ==========================================================================
   THE DREAMING TREE - DASHBOARD API UTILITIES
   ========================================================================== */

const API_BASE = '/api/v1';

// Token helpers
const getToken = () => localStorage.getItem('admin_token');
const setToken = (token) => localStorage.setItem('admin_token', token);
const removeToken = () => localStorage.removeItem('admin_token');

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      // If not on login page, redirect
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = '/admin/login.html';
      }
    }
    throw new Error(data.error || 'Server request failed.');
  }

  return data;
};

export const adminApi = {
  // Auth Operations
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) setToken(data.token);
    return data;
  },

  verifyOTP: async (userId, otp) => {
    const data = await request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp })
    });
    if (data.token) setToken(data.token);
    return data;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout request failed on server, purging local token', e);
    }
    removeToken();
    window.location.href = '/admin/login.html';
  },

  forgotPassword: async (email) => {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  resetPassword: async (token, newPassword) => {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  },

  getProfile: async () => {
    return request('/auth/profile');
  },

  // Analytics Operations
  getStats: async () => {
    return request('/analytics/stats');
  },

  getActivityLogs: async () => {
    return request('/analytics/logs');
  },

  // Reservation CRUD Operations
  getReservations: async (search = '', status = '', date = '') => {
    let query = `?search=${encodeURIComponent(search)}`;
    if (status) query += `&status=${status}`;
    if (date) query += `&date=${date}`;
    return request(`/reservations${query}`);
  },

  updateReservation: async (id, payload) => {
    return request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteReservation: async (id) => {
    return request(`/reservations/${id}`, {
      method: 'DELETE'
    });
  },

  // Menu CRUD Operations
  getMenuItems: async (category = '') => {
    const query = category ? `?category=${category}` : '';
    return request(`/menu${query}`);
  },

  getCategories: async () => {
    return request('/menu/categories');
  },

  createMenuItem: async (payload) => {
    return request('/menu', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateMenuItem: async (id, payload) => {
    return request(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteMenuItem: async (id) => {
    return request(`/menu/${id}`, {
      method: 'DELETE'
    });
  },

  createCategory: async (payload) => {
    return request('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  deleteCategory: async (id) => {
    return request(`/menu/categories/${id}`, {
      method: 'DELETE'
    });
  },

  // Settings Configuration Operations
  getSettings: async () => {
    return request('/settings');
  },

  updateSettings: async (payload) => {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }
};
