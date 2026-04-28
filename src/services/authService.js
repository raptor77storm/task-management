// src/services/authService.js
import axios from 'axios';
import serverConfig from '../config/serverConfig';

class AuthService {
  constructor() {
    this.createAxiosInstance();

    // Listen for API base changes
    window.addEventListener('api-config-changed', () => {
      this.createAxiosInstance();
    });
  }

  createAxiosInstance() {
    this.api = axios.create({
      baseURL: serverConfig.apiBase,
    });

    // Add JWT token to all requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses (unauthorized)
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';
        const isAuthRequest =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/change-password');

        if (status === 401 && !isAuthRequest) {
          this.logout();
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  async login(username, password) {
    try {
      const response = await this.api.post('/auth/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('mustChangePassword', response.data.mustChangePassword ? '1' : '0');
        return { success: true, data: response.data };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await this.api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('mustChangePassword', '0');
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed',
      };
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.api.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async updateCurrentUserEmail(email) {
    try {
      const response = await this.api.put('/auth/me/email', { email });
      localStorage.setItem('user', JSON.stringify(response.data));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Email update failed',
      };
    }
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChangePassword');
  }

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  getCurrentUserData() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAdmin() {
    const user = this.getCurrentUserData();
    return user?.isAdmin || false;
  }

  getCurrentUserId() {
    const user = this.getCurrentUserData();
    return user?.userNumber || null;
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  getMustChangePassword() {
    return localStorage.getItem('mustChangePassword') === '1';
  }
}

export default new AuthService();
