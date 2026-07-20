import axios from 'axios'
import config from '../config/env'

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Log 202 for successful responses
api.interceptors.response.use(
  (response) => {
    console.log(202)
    return response
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${config.apiBaseUrl}/auth/refresh`, {
            refreshToken,
          })

          const { token, refreshToken: newRefreshToken } = response.data
          localStorage.setItem('accessToken', token)
          localStorage.setItem('refreshToken', newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/users/login', { email, password }),

  register: (username: string, email: string, password: string) =>
    api.post('/users/register', { username, email, password }),

  logout: () => api.post('/auth/logout'),

  logoutAll: () => api.post('/auth/logout-all'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getMe: () => api.get('/users/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/users/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) =>
    api.post('/users/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/users/reset-password', { token, newPassword }),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }),

  verifyEmail: (token: string) => api.get('/auth/verify-email', { params: { token } }),

  revoke: (token: string, type: 'access' | 'refresh') =>
    api.post('/auth/revoke', { token, type }),

  getMyAuditLogs: () => api.get('/users/audit-logs'),
}

export const sessionApi = {
  getActiveSessions: () => api.get('/users/sessions'),
  
  revokeSession: (token: string) =>
    api.post('/users/sessions/revoke', { token }),
  
  revokeAllSessions: () => api.post('/users/sessions/revoke-all'),
}

export const oauthApi = {
  getLinkedAccounts: () => api.get('/oauth2/accounts'),

  unlinkAccount: (provider: string) =>
    api.delete(`/oauth2/unlink/${provider}`),
}

export const mfaApi = {
  getStatus: () => api.get('/mfa/status'),

  setup: () => api.post('/mfa/setup'),

  verify: (code: string) => api.post('/mfa/verify', { code }),

  disable: (code: string) => api.post('/mfa/disable', { code }),

  loginVerify: (challengeToken: string, code: string) =>
    api.post('/mfa/login-verify', { challengeToken, code }),
}

export const adminApi = {
  listUsers: () => api.get('/admin/users'),

  updateRole: (id: number, role: string) =>
    api.put(`/admin/users/${id}/role`, null, { params: { role } }),

  updateStatus: (id: number, enabled: boolean) =>
    api.put(`/admin/users/${id}/status`, null, { params: { enabled } }),

  getAuditLogs: () => api.get('/admin/audit-logs'),

  getUserAuditLogs: (userId: number) => api.get(`/admin/audit-logs/user/${userId}`),
}

export const protectedApi = {
  me: () => api.get('/protected/me'),

  adminCheck: () => api.get('/protected/admin'),

  managerCheck: () => api.get('/protected/manager'),
}

export default api
