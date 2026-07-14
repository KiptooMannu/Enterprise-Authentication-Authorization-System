import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')

    if (token && refreshToken) {
      localStorage.setItem('accessToken', token)
      localStorage.setItem('refreshToken', refreshToken)
      // Redirect to dashboard and trigger reload to fetch current user profile
      window.location.href = '/dashboard'
    } else {
      navigate('/login?error=OAuth2 authentication failed. Missing tokens.')
    }
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold">Completing sign in...</h2>
      <p className="text-muted-foreground mt-2">Please wait while we log you in securely.</p>
    </div>
  )
}

export default OAuthCallback
