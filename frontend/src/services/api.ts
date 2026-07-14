import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
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
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
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
}

export const sessionApi = {
  getActiveSessions: () => api.get('/users/sessions'),
  
  revokeSession: (token: string) =>
    api.post('/users/sessions/revoke', { token }),
  
  revokeAllSessions: () => api.post('/users/sessions/revoke-all'),
}

export const oauthApi = {
  oauthCallback: (provider: string, data: any) =>
    api.post(`/oauth2/callback/${provider}`, data),
  
  getLinkedAccounts: () => api.get('/oauth2/accounts'),
  
  unlinkAccount: (provider: string) =>
    api.delete(`/oauth2/unlink/${provider}`),
}

export default api
