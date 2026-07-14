import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  Shield, Smartphone, QrCode, Key, CheckCircle2, AlertCircle, 
  ArrowLeft, Copy, RefreshCw, Lock, Fingerprint
} from 'lucide-react'

const MFASetup: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'complete'>('intro')
  const [method, setMethod] = useState<'totp' | 'sms' | 'email'>('totp')
  const [secret, setSecret] = useState('JBSWY3DPEHPK3PXP')
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMethodSelect = (selectedMethod: 'totp' | 'sms' | 'email') => {
    setMethod(selectedMethod)
    setStep('setup')
  }

  const handleSetupComplete = () => {
    setStep('verify')
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate verification
    setTimeout(() => {
      if (verificationCode === '123456') {
        setStep('complete')
      } else {
        setError('Invalid verification code. Please try again.')
      }
      setLoading(false)
    }, 1000)
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const handleComplete = () => {
    navigate('/dashboard')
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
              <CardTitle>Choose Your Authentication Method</CardTitle>
              <CardDescription>Select how you want to receive your verification codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 rounded-lg p-6 cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => handleMethodSelect('totp')}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Smartphone className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Authenticator App</h3>
                    <p className="text-sm text-muted-foreground">
                      Use an authenticator app like Google Authenticator or Authy to generate codes
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div 
                className="border-2 rounded-lg p-6 cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => handleMethodSelect('sms')}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">SMS Text Message</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive verification codes via text message to your phone
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div 
                className="border-2 rounded-lg p-6 cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => handleMethodSelect('email')}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Key className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive verification codes via email to your registered address
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Skip for Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Setup */}
        {step === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle>Setup {method === 'totp' ? 'Authenticator App' : method === 'sms' ? 'SMS' : 'Email'}</CardTitle>
              <CardDescription>Follow these steps to configure your authentication method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {method === 'totp' && (
                <>
                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <QrCode className="h-5 w-5" />
                      <span>Step 1: Scan QR Code</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center justify-center">
                      <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <QrCode className="h-24 w-24 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Key className="h-5 w-5" />
                      <span>Step 2: Enter Secret Key (if you can't scan)</span>
                    </div>
                    <div className="flex gap-2">
                      <Input value={secret} readOnly className="font-mono" />
                      <Button variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {method === 'sms' && (
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Smartphone className="h-5 w-5" />
                    <span>Enter Your Phone Number</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    We'll send a verification code to this number
                  </p>
                </div>
              )}

              {method === 'email' && (
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Key className="h-5 w-5" />
                    <span>Verification Email</span>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">
                      A verification code will be sent to: <strong>{user?.email}</strong>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('intro')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSetupComplete} className="flex-1">
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
              <CardDescription>Enter the verification code to complete setup</CardDescription>
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
                    Enter the 6-digit code from your {method === 'totp' ? 'authenticator app' : method === 'sms' ? 'SMS' : 'email'}
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

              <div className="text-center">
                <Button variant="ghost" size="sm" type="button">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Code
                </Button>
              </div>
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
                Your account is now protected with multi-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Enhanced Security</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account now requires an additional verification code when signing in
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Fingerprint className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Backup Codes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Save these backup codes in case you lose access to your authentication method
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['123456', '789012', '345678', '901234', '567890', '123456'].map((code, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-2 rounded text-center font-mono text-sm">
                      {code}
                    </div>
                  ))}
                </div>
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
