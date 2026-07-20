import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import config from '../config/env'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Lock, Mail, AlertCircle, Shield, MapPin } from 'lucide-react'
import { geolocationService, GeolocationData } from '../services/geolocationService'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaChallengeToken, setMfaChallengeToken] = useState('')
  const [locationData, setLocationData] = useState<GeolocationData | null>(null)
  const [acquiringLocation, setAcquiringLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const { login, verifyMfaLogin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) {
      setError(err)
    }
  }, [searchParams])

  const handleOAuthLogin = (provider: string) => {
    setError('')
    if (!navigator.onLine) {
      setError('Network error: No internet connection. Please check your network and try again.')
      return
    }
    window.location.href = `${config.oauthBaseUrl}/oauth2/authorization/${provider}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLocationError('')

    if (!navigator.onLine) {
      setError('Network error: No internet connection. Please check your network and try again.')
      return
    }

    setLoading(true)
    setAcquiringLocation(true)

    try {
      // Acquire location before login
      const location = await geolocationService.getCurrentLocation(10000)
      setLocationData(location)
      setAcquiringLocation(false)

      if (mfaRequired) {
        // Verify MFA code
        await verifyMfaLogin(mfaChallengeToken, mfaCode)
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }
        navigate('/dashboard')
      } else {
        // First step: password authentication with location data
        const result = await login(email, password, location)
        if (result.mfaRequired) {
          setMfaRequired(true)
          setMfaChallengeToken(result.mfaChallengeToken || '')
          setError('')
        } else {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email)
          } else {
            localStorage.removeItem('rememberedEmail')
          }
          navigate('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
      setAcquiringLocation(false)
    }
  }

  // Pre-fill remembered email
  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail')
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">AuthCore</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {mfaRequired && (
              <div className="space-y-2">
                <label htmlFor="mfaCode" className="text-sm font-medium">
                  Two-Factor Authentication Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mfaCode"
                    type="text"
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="rememberMe" className="text-sm font-medium">
                Remember me
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (mfaRequired ? 'Verifying...' : 'Signing in...') : (mfaRequired ? 'Verify Code' : 'Sign in')}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('google')}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('github')}
              >
                GitHub
              </Button>
            </div>

            <div className="text-center text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
