import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, mfaApi } from '../services/api'
import { GeolocationData } from '../services/geolocationService'

interface User {
  id: number
  username: string
  email: string
  role: string
  enabled: boolean
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, location?: GeolocationData | null) => Promise<{ mfaRequired: boolean; mfaChallengeToken?: string }>
  verifyMfaLogin: (challengeToken: string, code: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  logoutAll: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const response = await authApi.getMe()
        setUser(response.data)
      } catch (error) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string, location?: GeolocationData | null) => {
    const response = await authApi.login(email, password, location)
    const data = response.data

    // Check if MFA is required
    if (data.mfaRequired) {
      return { mfaRequired: true, mfaChallengeToken: data.mfaChallengeToken }
    }

    // Normal login flow
    const { token, refreshToken } = data
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', refreshToken)

    const userResponse = await authApi.getMe()
    setUser(userResponse.data)
    return { mfaRequired: false }
  }

  const verifyMfaLogin = async (challengeToken: string, code: string) => {
    const response = await mfaApi.loginVerify(challengeToken, code)
    const { token, refreshToken } = response.data
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', refreshToken)

    const userResponse = await authApi.getMe()
    setUser(userResponse.data)
  }

  const register = async (username: string, email: string, password: string) => {
    await authApi.register(username, email, password)
    // Auto-login after registration
    await login(email, password)
  }

  const logout = () => {
    authApi.logout().catch(console.error)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  const logoutAll = async () => {
    await authApi.logoutAll()
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    verifyMfaLogin,
    register,
    logout,
    logoutAll,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
