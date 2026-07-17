import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error')
        setMessage('No verification token provided in the URL.')
        return
      }

      try {
        const response = await authApi.verifyEmail(token)
        setStatus('success')
        setMessage(response.data.message || 'Your email address has been verified successfully.')
      } catch (error: any) {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Invalid or expired verification token.')
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            Account activation status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-muted-foreground">Verifying your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-pulse" />
              <p className="text-medium text-foreground">{message}</p>
              <Button asChild className="w-full mt-4">
                <Link to="/login">Proceed to Login</Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="text-medium text-destructive">{message}</p>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/register">Back to Registration</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default VerifyEmail
