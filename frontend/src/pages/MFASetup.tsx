import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mfaApi } from '../services/api'
import { getApiErrorMessage } from '../lib/errors'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  Shield, Smartphone, QrCode, Key, CheckCircle2, ArrowLeft, Copy,
  AlertCircle, Lock
} from 'lucide-react'

const MFASetup: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'complete'>('intro')
  const [secret, setSecret] = useState('')
  const [otpAuthUri, setOtpAuthUri] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetupStart = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await mfaApi.setup()
      setSecret(response.data.secret)
      setOtpAuthUri(response.data.otpAuthUri)
      setStep('setup')
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to start MFA setup'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await mfaApi.verify(verificationCode)
      setStep('complete')
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Invalid verification code'))
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const handleComplete = () => {
    navigate('/dashboard')
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold">Multi-Factor Authentication</h1>
              <p className="text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
          </div>
        </div>

        {/* Step 1: Introduction */}
        {step === 'intro' && (
          <Card>
            <CardHeader>
              <CardTitle>Set Up Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account using an authenticator app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Authenticator App</h3>
                    <p className="text-sm text-muted-foreground">
                      Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to generate time-based codes
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Skip for Now
                </Button>
                <Button onClick={handleSetupStart} className="flex-1" disabled={loading}>
                  {loading ? 'Initializing...' : 'Get Started'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Setup */}
        {step === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Scan this QR code with your authenticator app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg flex items-center justify-center">
                {otpAuthUri ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUri)}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <QrCode className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-5 w-5" />
                  <span>Or enter this secret key manually</span>
                </div>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('intro')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep('verify')} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Verify */}
        {step === 'verify' && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Setup</CardTitle>
              <CardDescription>Enter the verification code from your authenticator app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep('setup')} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>MFA Setup Complete!</CardTitle>
              <CardDescription>
                Your account is now protected with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Enhanced Security</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account now requires a verification code from your authenticator app when signing in
                </p>
              </div>

              <Button onClick={handleComplete} className="w-full">
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MFASetup
